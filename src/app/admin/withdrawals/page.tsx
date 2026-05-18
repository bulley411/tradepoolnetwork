import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  
  const { data: withdrawals, error } = await supabase
    .from('withdrawals')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .order('requested_at', { ascending: false });
  
  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading withdrawals: {error.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-6">Withdrawal Requests</h1>
      
      {!withdrawals || withdrawals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No withdrawal requests</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Method</th>
                <th className="text-left p-3">Net Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Requested</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal: any) => (
                <tr key={withdrawal.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{withdrawal.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{withdrawal.profiles?.email}</div>
                  </td>
                  <td className="p-3">
                    ${withdrawal.amount_usd?.toFixed(2)}
                    {withdrawal.amount_ngn && (
                      <div className="text-xs text-gray-500">≈ ₦{withdrawal.amount_ngn.toLocaleString()}</div>
                    )}
                  </td>
                  <td className="p-3 capitalize">{withdrawal.withdrawal_method} </td>
                  <td className="p-3 font-medium">
                    {withdrawal.withdrawal_method === 'crypto' 
                      ? `$${withdrawal.net_amount?.toFixed(2)} USDT`
                      : `₦${(withdrawal.net_amount * (withdrawal.exchange_rate || 1500)).toLocaleString()}`
                    }
                  </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full
                      ${withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-800' : ''}
                      ${withdrawal.status === 'processed' ? 'bg-green-100 text-green-800' : ''}
                      ${withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {format(new Date(withdrawal.requested_at), 'MMM d, yyyy')}
                  </td>
                  <td className="p-3">
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <form action={`/api/admin/withdrawals/${withdrawal.id}/approve`} method="POST">
                          <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                            Approve
                          </button>
                        </form>
                        <form action={`/api/admin/withdrawals/${withdrawal.id}/reject`} method="POST">
                          <input type="hidden" name="user_id" value={withdrawal.user_id} />
                          <input type="hidden" name="amount" value={withdrawal.amount_usd} />
                          <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                    {withdrawal.status === 'approved' && (
                      <form action={`/api/admin/withdrawals/${withdrawal.id}/process`} method="POST">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                          Mark as Processed
                        </button>
                      </form>
                    )}
                    {withdrawal.status === 'processed' && (
                      <span className="text-green-600 text-sm">✓ Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}