'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getUSDToNGNRate, convertUSDtoNGN } from '@/services/exchange-rate-service';

interface WithdrawalOption {
  id: string;
  option_type: 'crypto' | 'bank';
  usdt_address: string | null;
  crypto_network: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<{ available_balance: number } | null>(null);
  const [options, setOptions] = useState<WithdrawalOption[]>([]);
  const [defaultMethod, setDefaultMethod] = useState('crypto');
  const [exchangeRate, setExchangeRate] = useState(1500);
  
  const [selectedMethod, setSelectedMethod] = useState('crypto');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<{ fee: number; net: number; netNgn: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculatePreview();
  }, [amount, selectedMethod, exchangeRate]);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: walletData } = await supabase
      .from('wallets')
      .select('available_balance')
      .eq('user_id', user.id)
      .single();
    setWallet(walletData);
    
    const { data: optionsData } = await supabase
      .from('withdrawal_options')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);
    setOptions(optionsData || []);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_withdrawal_method')
      .eq('id', user.id)
      .single();
    const defaultMethodValue = profile?.default_withdrawal_method || 'crypto';
    setDefaultMethod(defaultMethodValue);
    setSelectedMethod(defaultMethodValue);
    
    const rate = await getUSDToNGNRate();
    setExchangeRate(rate);
    
    setLoading(false);
  }

  function calculatePreview() {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPreview(null);
      return;
    }
    
    let fee = 0;
    let net = amountNum;
    
    if (selectedMethod === 'crypto') {
      fee = 1;
      net = amountNum - fee;
    } else {
      fee = 100 / exchangeRate;
      net = amountNum - fee;
    }
    
    const netNgn = net * exchangeRate;
    
    setPreview({ fee, net, netNgn });
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    
    // Allow empty string
    if (value === '') {
      setAmount('');
      setError('');
      return;
    }
    
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
      value = parts.join('.');
    }
    
    setAmount(value);
    setError('');
  }

  function validateAmount(amountNum: number): string | null {
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Please enter a valid amount';
    }
    
    const minAmount = selectedMethod === 'crypto' ? 5 : (1000 / exchangeRate);
    const maxAmount = selectedMethod === 'crypto' ? 10000 : (500000 / exchangeRate);
    
    if (amountNum < minAmount) {
      return `Minimum withdrawal amount is $${minAmount.toFixed(2)}`;
    }
    
    if (amountNum > maxAmount) {
      return `Maximum withdrawal amount is $${maxAmount.toFixed(2)}`;
    }
    
    if (wallet && amountNum > wallet.available_balance) {
      return `Insufficient balance. Available: $${wallet.available_balance.toFixed(2)}`;
    }
    
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    const amountNum = parseFloat(amount);
    const validationError = validateAmount(amountNum);
    
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }
    
    const selectedOption = options.find(opt => opt.option_type === selectedMethod);
    if (!selectedOption) {
      setError('Selected withdrawal method not configured');
      setSubmitting(false);
      return;
    }
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const fee = selectedMethod === 'crypto' ? 1 : (100 / exchangeRate);
    const netAmount = amountNum - fee;
    
    const withdrawalData: any = {
      user_id: user!.id,
      amount_usd: amountNum,
      fee: fee,
      net_amount: netAmount,
      withdrawal_method: selectedMethod,
      exchange_rate: exchangeRate,
      notes: notes || null,
    };
    
    if (selectedMethod === 'crypto') {
      withdrawalData.usdt_address = selectedOption.usdt_address;
      withdrawalData.crypto_network = selectedOption.crypto_network;
    } else {
      withdrawalData.amount_ngn = netAmount * exchangeRate;
      withdrawalData.bank_name = selectedOption.bank_name;
      withdrawalData.bank_account_name = selectedOption.bank_account_name;
      withdrawalData.bank_account_number = selectedOption.bank_account_number;
    }
    
    const { error: insertError } = await supabase
      .from('withdrawals')
      .insert(withdrawalData);
    
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess('Withdrawal request submitted! Admin will process within 3 business days.');
      setAmount('');
      setNotes('');
    }
    
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!options || options.length === 0) {
    return (
      <div className="py-8 max-w-lg mx-auto text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Withdrawal Options Set</h2>
          <p className="text-yellow-700 mb-4">
            You need to set up at least one withdrawal method before you can withdraw funds.
          </p>
          <button
            onClick={() => router.push('/member/withdrawal-options')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Set Withdrawal Options
          </button>
        </div>
      </div>
    );
  }

  const selectedOption = options.find(opt => opt.option_type === selectedMethod);
  const amountNum = parseFloat(amount);
  const isValidAmount = !isNaN(amountNum) && amountNum > 0 && !validateAmount(amountNum);

  return (
    <div className="py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Request Withdrawal</h1>
      <p className="text-gray-600 mb-6">
        Available Balance: <span className="font-bold text-green-600">${wallet?.available_balance?.toFixed(2)}</span>
        <span className="text-sm text-gray-400 ml-2">(≈ ₦{((wallet?.available_balance || 0) * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Withdrawal Method */}
        <div>
          <label className="block text-sm font-medium mb-2">Withdrawal Method</label>
          <div className="grid grid-cols-2 gap-3">
            {options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedMethod(opt.option_type)}
                className={`p-3 border rounded-lg text-center transition ${
                  selectedMethod === opt.option_type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt.option_type === 'crypto' ? 'Crypto (USDT)' : 'Bank (NGN)'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected Method Details */}
        {selectedOption && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            {selectedMethod === 'crypto' ? (
              <div>
                <p className="font-medium">Sending to:</p>
                <p className="font-mono text-xs break-all">{selectedOption.usdt_address}</p>
                <p className="text-gray-500 mt-1">Network: {selectedOption.crypto_network}</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Bank Details:</p>
                <p>{selectedOption.bank_name}</p>
                <p>{selectedOption.bank_account_name}</p>
                <p>{selectedOption.bank_account_number}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount ({selectedMethod === 'crypto' ? 'USDT' : 'USD'})
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Min: ${(selectedMethod === 'crypto' ? 5 : (1000 / exchangeRate)).toFixed(2)}</span>
            <span>Max: ${(selectedMethod === 'crypto' ? 10000 : (500000 / exchangeRate)).toFixed(2)}</span>
          </div>
          {selectedMethod === 'bank' && amount && isValidAmount && (
            <p className="text-xs text-gray-500 mt-1">
              ≈ ₦{(amountNum * exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        
        {/* Preview */}
        {preview && preview.net > 0 && isValidAmount && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Withdrawal Preview</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${amountNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Fee:</span>
                <span>{selectedMethod === 'crypto' ? `$${preview.fee.toFixed(2)}` : `₦100 (≈ $${preview.fee.toFixed(2)})`}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>You Receive:</span>
                <span>
                  {selectedMethod === 'crypto' 
                    ? `$${preview.net.toFixed(2)} USDT`
                    : `₦${preview.netNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
            {success}
          </div>
        )}
        
        <button
          type="submit"
          disabled={submitting || !isValidAmount}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
        </button>
        
        <p className="text-xs text-gray-400 text-center">
          Withdrawals take up to 3 business days to process.
        </p>
      </form>
    </div>
  );
}