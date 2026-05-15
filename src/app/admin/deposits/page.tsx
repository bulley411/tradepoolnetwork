import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export default async function AdminDepositsPage() {
  const supabase = await createClient();
  
  // Fetch deposits with user profile info
  const { data: deposits, error } = await supabase
    .from('deposits')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        full_name,
        phone
      )
    `)
    .order('submitted_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching deposits:', error);
    return <div>Error loading deposits</div>;
  }
  
  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deposits Management</h1>
      </div>
      
      {!deposits || deposits.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No deposits found</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium">User</th>
                <th className="text-left p-3 text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-sm font-medium">Method</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Submitted</th>
                <th className="text-left p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit: any) => (
                <tr key={deposit.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{deposit.profiles?.full_name || deposit.profiles?.email || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{deposit.profiles?.email}</div>
                   </td>
                  <td className="p-3">
                    ${deposit.amount?.toFixed(2) || 'Pending'}
                   </td>
                  <td className="p-3">
                    <span className="capitalize">{deposit.payment_method || deposit.channel || 'N/A'}</span>
                   </td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full
                      ${deposit.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                      ${deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${deposit.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {deposit.status}
                    </span>
                   </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(deposit.submitted_at), 'MMM d, yyyy')}
                   </td>
                  <td className="p-3">
                    {deposit.status === 'pending' && (
                      <form action={`/api/admin/deposits/${deposit.id}/approve`} method="POST">
                        <input type="hidden" name="amount" value={deposit.amount || 0} />
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                          Approve
                        </button>
                      </form>
                    )}
                    {deposit.status === 'confirmed' && (
                      <span className="text-green-600 text-sm">✓ Approved</span>
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