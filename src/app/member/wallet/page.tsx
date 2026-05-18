import { createClient } from '@/lib/supabase/server';
import { getUSDToNGNRate, convertUSDtoNGN } from '@/services/exchange-rate-service';
import Link from 'next/link';
import { format } from 'date-fns';
import { TransactionFilter } from '@/components/member/transaction-filter';
import { ExportButton } from '@/components/member/export-button';

export default async function WalletPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please login to view your wallet</div>;
  }
  
  // Get wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  // Get transaction history with optional filter from URL
  const searchParams = await supabase.getUrl?.() || '';
  const typeFilter = new URLSearchParams(searchParams).get('type');
  
  let query = supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('type', typeFilter);
  }
  
  const { data: transactions } = await query;
  
  // Get exchange rate and NGN equivalents
  const exchangeRate = await getUSDToNGNRate();
  
  // Calculate correct total: Available + Locked (Profit is already included in Available)
  const available = wallet?.available_balance || 0;
  const locked = wallet?.locked_balance || 0;
  const profit = wallet?.profit_balance || 0;
  const referral = wallet?.referral_balance || 0;
  
  const totalBalance = available + locked;
  const ngnTotal = await convertUSDtoNGN(totalBalance);
  const ngnAvailable = await convertUSDtoNGN(available);
  const ngnLocked = await convertUSDtoNGN(locked);
  const ngnProfit = await convertUSDtoNGN(profit);
  const ngnReferral = await convertUSDtoNGN(referral);
  
  // Helper function to get transaction icon and color
  function getTransactionStyle(type: string) {
    switch (type) {
      case 'deposit_credited':
        return { icon: '💰', color: 'text-green-600', bg: 'bg-green-100', label: 'Deposit' };
      case 'withdrawal_deducted':
        return { icon: '💸', color: 'text-red-600', bg: 'bg-red-100', label: 'Withdrawal' };
      case 'withdrawal_processed':
        return { icon: '💸', color: 'text-red-600', bg: 'bg-red-100', label: 'Withdrawal' };
      case 'withdrawal_rejected':
        return { icon: '↩️', color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Withdrawal Rejected' };
      case 'session_locked':
        return { icon: '🔒', color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Funds Locked' };
      case 'session_unlocked':
        return { icon: '🔓', color: 'text-blue-600', bg: 'bg-blue-100', label: 'Funds Unlocked' };
      case 'pnl_payout':
        return { icon: '📈', color: 'text-green-600', bg: 'bg-green-100', label: 'Profit Payout' };
      case 'commission_earned':
        return { icon: '👥', color: 'text-purple-600', bg: 'bg-purple-100', label: 'Referral Commission' };
      case 'fee_deducted':
        return { icon: '⚙️', color: 'text-gray-600', bg: 'bg-gray-100', label: 'Fee' };
      case 'deposit_rejected':
        return { icon: '❌', color: 'text-red-600', bg: 'bg-red-100', label: 'Deposit Rejected' };
      default:
        return { icon: '📝', color: 'text-gray-600', bg: 'bg-gray-100', label: type };
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header with Export Button */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and view transaction history</p>
        </div>
        {transactions && transactions.length > 0 && (
          <ExportButton />
        )}
      </div>
      
      {/* Balance Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-6 bg-gradient-to-br from-blue-50 to-white">
          <h2 className="text-sm text-muted-foreground">Total Balance</h2>
          <p className="mt-2 text-3xl font-bold text-blue-600">${totalBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">≈ ₦{ngnTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Available + Locked funds</p>
        </div>
        
        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Available Balance</h2>
          <p className="mt-2 text-2xl font-bold text-green-600">${available.toFixed(2)}</p>
          <p className="text-xs text-gray-500">≈ ₦{ngnAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Ready to withdraw or commit</p>
        </div>
        
        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Locked Balance</h2>
          <p className="mt-2 text-2xl font-bold text-yellow-600">${locked.toFixed(2)}</p>
          <p className="text-xs text-gray-500">≈ ₦{ngnLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Committed to active sessions</p>
        </div>
        
        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Total Profit Earnings</h2>
          <p className="mt-2 text-2xl font-bold text-green-600">${profit.toFixed(2)}</p>
          <p className="text-xs text-gray-500">≈ ₦{ngnProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Already included in Available</p>
        </div>
        
        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Total Referral Earnings</h2>
          <p className="mt-2 text-2xl font-bold text-purple-600">${referral.toFixed(2)}</p>
          <p className="text-xs text-gray-500">≈ ₦{ngnReferral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Already included in Available</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/member/deposits"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Deposit Funds
        </Link>
        <Link
          href="/member/withdraw"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Withdraw Funds
        </Link>
        <Link
          href="/member/sessions"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Browse Sessions
        </Link>
      </div>
      
      {/* Transaction History with Filter */}
      <div className="rounded-xl border overflow-hidden">
        <div className="border-b px-6 py-4 bg-muted/30 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">Complete record of all wallet activities</p>
          </div>
          
          <TransactionFilter />
        </div>
        
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Try changing the filter or deposit funds to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Description</th>
                  <th className="text-right p-3 text-sm font-medium">Amount (USD)</th>
                  <th className="text-right p-3 text-sm font-medium">Amount (NGN)</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => {
                  const style = getTransactionStyle(tx.type);
                  const ngnAmount = Math.abs(tx.amount) * exchangeRate;
                  
                  return (
                    <tr key={tx.id} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${style.bg}`}>
                            {style.icon}
                          </span>
                          <span className="text-sm font-medium">{style.label}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {tx.description || tx.type}
                        {tx.type === 'withdrawal_processed' && tx.fee && (
                          <span className="text-xs text-gray-400 block">Fee: ${tx.fee?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount > 0 ? `$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </td>
                      <td className="p-3 text-right text-sm text-gray-500">
                        ≈ ₦{ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      {transactions && transactions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-500">Total Deposits</h3>
            <p className="text-xl font-bold text-green-600">
              ${transactions
                .filter(tx => tx.type === 'deposit_credited')
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-500">Total Withdrawals</h3>
            <p className="text-xl font-bold text-red-600">
              ${Math.abs(transactions
                .filter(tx => tx.type === 'withdrawal_processed')
                .reduce((sum, tx) => sum + tx.amount, 0))
                .toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-500">Total Profit Earned</h3>
            <p className="text-xl font-bold text-green-600">
              ${transactions
                .filter(tx => tx.type === 'pnl_payout')
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}