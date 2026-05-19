import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get user profile
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (userError || !user) {
    notFound();
  }
  
  // Get wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', id)
    .single();
  
  // Get withdrawal options
  const { data: withdrawalOptions } = await supabase
    .from('withdrawal_options')
    .select('*')
    .eq('user_id', id)
    .eq('is_active', true);
  
  // Get referrals (users referred by this user)
  const { data: referrals } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('referred_by', id);
  
  // Get recent transactions
  const { data: transactions } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Get recent deposits
  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Get recent withdrawals
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', id)
    .order('requested_at', { ascending: false })
    .limit(10);
  
  const totalDeposits = deposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount_usd || 0), 0) || 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/users" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold">{user.full_name || 'User'}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <form action={`/api/admin/users/${id}/impersonate`} method="POST">
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Login as User
            </button>
          </form>
        </div>
      </div>
      
      {/* User Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Role</h3>
          <p className="text-xl font-semibold mt-1 capitalize">{user.role}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Status</h3>
          <p className={`text-xl font-semibold mt-1 ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
            {user.is_active ? 'Active' : 'Suspended'}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Phone</h3>
          <p className="text-xl font-semibold mt-1">{user.phone || 'Not set'}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Referral Code</h3>
          <p className="text-xl font-mono font-semibold mt-1">{user.referral_code}</p>
        </div>
      </div>
      
      {/* Wallet Section */}
      <div className="rounded-xl border overflow-hidden">
        <div className="border-b px-6 py-4 bg-muted/30">
          <h2 className="text-lg font-semibold">Wallet Balance</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">${wallet?.available_balance?.toFixed(2) || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Locked</p>
              <p className="text-2xl font-bold text-yellow-600">${wallet?.locked_balance?.toFixed(2) || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="text-2xl font-bold text-green-600">${wallet?.profit_balance?.toFixed(2) || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Referral</p>
              <p className="text-2xl font-bold text-purple-600">${wallet?.referral_balance?.toFixed(2) || '0'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="text-sm text-muted-foreground">Total Deposits: ${totalDeposits.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">Total Withdrawals: ${totalWithdrawals.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Withdrawal Options */}
      {withdrawalOptions && withdrawalOptions.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b px-6 py-4 bg-muted/30">
            <h2 className="text-lg font-semibold">Withdrawal Options</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {withdrawalOptions.map((option) => (
                <div key={option.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <p className="font-medium capitalize">{option.option_type}</p>
                  {option.option_type === 'crypto' ? (
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Address: <span className="font-mono">{option.usdt_address}</span></p>
                      <p>Network: {option.crypto_network}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Bank: {option.bank_name}</p>
                      <p>Account: {option.bank_account_name} - {option.bank_account_number}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Referrals */}
      {referrals && referrals.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b px-6 py-4 bg-muted/30">
            <h2 className="text-lg font-semibold">Referred Users ({referrals.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Name</th>
                  <th className="text-left p-3 text-sm font-medium">Email</th>
                  <th className="text-left p-3 text-sm font-medium">Joined</th>
                 </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-t">
                    <td className="p-3">{ref.full_name || 'No name'}</td>
                    <td className="p-3">{ref.email}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(new Date(ref.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Recent Transactions */}
      {transactions && transactions.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b px-6 py-4 bg-muted/30">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                  <th className="text-left p-3 text-sm font-medium">Description</th>
                  <th className="text-right p-3 text-sm font-medium">Amount</th>
                  <th className="text-left p-3 text-sm font-medium">Date</th>
                 </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="p-3 text-sm">{tx.type.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-sm text-gray-600">{tx.description || '-'}</td>
                    <td className={`p-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}