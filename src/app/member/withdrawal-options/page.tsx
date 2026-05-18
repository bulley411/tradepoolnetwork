'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WithdrawalOption {
  id: string;
  option_type: 'crypto' | 'bank';
  is_active: boolean;
  usdt_address: string | null;
  crypto_network: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
}

export default function WithdrawalOptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cryptoOption, setCryptoOption] = useState<WithdrawalOption | null>(null);
  const [bankOption, setBankOption] = useState<WithdrawalOption | null>(null);
  const [defaultMethod, setDefaultMethod] = useState('crypto');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form states
  const [usdtAddress, setUsdtAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('ERC20');
  const [enableCrypto, setEnableCrypto] = useState(false);
  
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [enableBank, setEnableBank] = useState(false);

  useEffect(() => {
    loadWithdrawalOptions();
  }, []);

  async function loadWithdrawalOptions() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_withdrawal_method')
      .eq('id', user.id)
      .single();
    
    if (profile?.default_withdrawal_method) {
      setDefaultMethod(profile.default_withdrawal_method);
    }
    
    const { data: options } = await supabase
      .from('withdrawal_options')
      .select('*')
      .eq('user_id', user.id);
    
    if (options) {
      const crypto = options.find(opt => opt.option_type === 'crypto');
      const bank = options.find(opt => opt.option_type === 'bank');
      
      if (crypto) {
        setCryptoOption(crypto);
        setUsdtAddress(crypto.usdt_address || '');
        setCryptoNetwork(crypto.crypto_network || 'ERC20');
        setEnableCrypto(crypto.is_active);
      }
      
      if (bank) {
        setBankOption(bank);
        setBankName(bank.bank_name || '');
        setBankAccountName(bank.bank_account_name || '');
        setBankAccountNumber(bank.bank_account_number || '');
        setEnableBank(bank.is_active);
      }
    }
    
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      setSaving(false);
      return;
    }
    
    // Save Crypto Option
    if (enableCrypto && usdtAddress) {
      const cryptoData = {
        user_id: user.id,
        option_type: 'crypto',
        is_active: true,
        usdt_address: usdtAddress,
        crypto_network: cryptoNetwork,
      };
      
      if (cryptoOption) {
        await supabase
          .from('withdrawal_options')
          .update(cryptoData)
          .eq('id', cryptoOption.id);
      } else {
        await supabase
          .from('withdrawal_options')
          .insert(cryptoData);
      }
    } else if (cryptoOption && !enableCrypto) {
      await supabase
        .from('withdrawal_options')
        .update({ is_active: false })
        .eq('id', cryptoOption.id);
    }
    
    // Save Bank Option
    if (enableBank && bankAccountNumber && bankAccountName && bankName) {
      const bankData = {
        user_id: user.id,
        option_type: 'bank',
        is_active: true,
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
      };
      
      if (bankOption) {
        await supabase
          .from('withdrawal_options')
          .update(bankData)
          .eq('id', bankOption.id);
      } else {
        await supabase
          .from('withdrawal_options')
          .insert(bankData);
      }
    } else if (bankOption && !enableBank) {
      await supabase
        .from('withdrawal_options')
        .update({ is_active: false })
        .eq('id', bankOption.id);
    }
    
    // Update default method
    await supabase
      .from('profiles')
      .update({ default_withdrawal_method: defaultMethod })
      .eq('id', user.id);
    
    setMessage({ type: 'success', text: 'Withdrawal options saved successfully!' });
    loadWithdrawalOptions();
    setSaving(false);
  }

  const hasAnyOption = (enableCrypto && usdtAddress) || (enableBank && bankAccountNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Withdrawal Options</h1>
      <p className="text-gray-600 mb-6">Set up how you want to receive your funds</p>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* Crypto Withdrawal */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">💰 Crypto Withdrawal (USDT)</h2>
              <p className="text-sm text-gray-500">Receive funds in USDT</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableCrypto}
                onChange={(e) => setEnableCrypto(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {enableCrypto && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">USDT Wallet Address *</label>
                <input
                  type="text"
                  value={usdtAddress}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                  placeholder="0x... or T..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={enableCrypto}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Network</label>
                <select
                  value={cryptoNetwork}
                  onChange={(e) => setCryptoNetwork(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="TRC20">TRC20 (Tron)</option>
                  <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Bank Withdrawal */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">🏦 Bank Withdrawal (NGN)</h2>
              <p className="text-sm text-gray-500">Receive funds in Naira (₦100 fee per withdrawal)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableBank}
                onChange={(e) => setEnableBank(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {enableBank && (
            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., First Bank, GTBank, Access Bank"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={enableBank}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Name *</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Your full name as on bank account"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={enableBank}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number *</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={enableBank}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Default Withdrawal Method */}
        {hasAnyOption && (
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">⭐ Default Withdrawal Method</h2>
            <select
              value={defaultMethod}
              onChange={(e) => setDefaultMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {enableCrypto && usdtAddress && <option value="crypto">Crypto (USDT)</option>}
              {enableBank && bankAccountNumber && <option value="bank">Bank Transfer (NGN)</option>}
            </select>
          </div>
        )}
        
        {/* Limits Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Withdrawal Limits & Fees</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>Crypto (USDT):</strong> Min $5 | Max $10,000 | Fee: $1</p>
            <p><strong>Bank (NGN):</strong> Min ₦1,000 | Max ₦500,000 | Fee: ₦100</p>
            <p className="mt-2 text-yellow-700">⚠️ Withdrawals require 3 business days processing time</p>
          </div>
        </div>
        
        {message && (
          <div className={`px-3 py-2 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Withdrawal Options'}
        </button>
      </form>
    </div>
  );
}