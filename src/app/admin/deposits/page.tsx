import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export default async function AdminDepositsPage() {
  const supabase = await createClient();
  
  // Query 1: Get all deposits
  const { data: deposits, error: depositsError } = await supabase
    .from('deposits')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (depositsError) {
    console.error('Deposits error:', depositsError);
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading deposits</p>
          <p className="text-sm mt-1">{depositsError.message}</p>
        </div>
      </div>
    );
  }
  
  if (!deposits || deposits.length === 0) {
    return (
      <div className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Deposits Management</h1>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No deposits found</p>
        </div>
      </div>
    );
  }
  
  // Query 2: Get user profiles for all deposits
  const userIds = [...new Set(deposits.map(d => d.user_id).filter(Boolean))];
  
  let userProfiles: Record<string, any> = {};
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .in('id', userIds);
    
    userProfiles = (profiles || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }
  
  // Helper function to truncate hash
  function truncateHash(hash: string | null) {
    if (!hash) return 'N/A';
    if (hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
  }
  
  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deposits Management</h1>
      </div>
      
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b">
              <th className="text-left p-3 text-sm font-medium">User</th>
              <th className="text-left p-3 text-sm font-medium">Amount</th>
              <th className="text-left p-3 text-sm font-medium">Channel</th>
              <th className="text-left p-3 text-sm font-medium">Transaction Hash</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
              <th className="text-left p-3 text-sm font-medium">Submitted</th>
              <th className="text-left p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => {
              const profile = userProfiles[deposit.user_id];
              const userName = profile?.full_name || profile?.email || 'Unknown';
              
              return (
                <tr key={deposit.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{userName}</div>
                    {profile?.email && (
                      <div className="text-xs text-muted-foreground">{profile.email}</div>
                    )}
                  </td>
                  <td className="p-3">
                    {deposit.amount ? `$${Number(deposit.amount).toFixed(2)}` : 'Pending'}
                  </td>
                  <td className="p-3 capitalize">
                    {deposit.payment_method || deposit.channel || 'N/A'}
                  </td>
                  <td className="p-3">
                    {deposit.transaction_hash || deposit.tx_hash ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">
                          {truncateHash(deposit.transaction_hash || deposit.tx_hash)}
                        </code>
                        <a
                          href={`https://etherscan.io/tx/${deposit.transaction_hash || deposit.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          🔗
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No hash</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      deposit.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''
                    } ${
                      deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''
                    } ${
                      deposit.status === 'rejected' ? 'bg-red-100 text-red-800' : ''
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(deposit.created_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="p-3">
{deposit.status === 'pending' && (
  <div className="flex gap-2">
    <form action={`/api/admin/deposits/${deposit.id}/approve`} method="POST">
      <input type="hidden" name="amount" value={deposit.amount || 0} />
      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
        Approve
      </button>
    </form>
    <form action={`/api/admin/deposits/${deposit.id}/reject`} method="POST">
      <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
        Reject
      </button>
    </form>
  </div>
)}
                    {deposit.status === 'confirmed' && (
                      <span className="text-green-600 text-sm">✓ Approved</span>
                    )}
                    {deposit.status === 'rejected' && (
                      <span className="text-red-600 text-sm">✗ Rejected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}