import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import Link from 'next/link';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  
  // Get all users with their profiles and wallets
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      *,
      wallets (
        available_balance,
        locked_balance,
        profit_balance,
        referral_balance
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }
  
  // Get referral counts for each user
  const { data: referralCounts } = await supabase
    .from('profiles')
    .select('referred_by, id')
    .not('referred_by', 'is', null);
  
  const referralCountMap = new Map();
  referralCounts?.forEach(profile => {
    if (profile.referred_by) {
      referralCountMap.set(profile.referred_by, (referralCountMap.get(profile.referred_by) || 0) + 1);
    }
  });
  
  // Get user roles for filtering
  const roles = [...new Set(users?.map(u => u.role) || [])];
  
  // Stats
  const totalUsers = users?.length || 0;
  const totalMembers = users?.filter(u => u.role === 'member').length || 0;
  const totalAdmins = users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0;
  const totalActiveUsers = users?.filter(u => u.is_active).length || 0;
  const totalBalance = users?.reduce((sum, user) => sum + (user.wallets?.[0]?.available_balance || 0), 0) || 0;
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <Link
          href="/admin/users/invite"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Invite User
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border p-4 bg-gradient-to-br from-blue-50 to-white">
          <h3 className="text-sm text-muted-foreground">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Members</h3>
          <p className="text-2xl font-bold text-green-600">{totalMembers}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Admins</h3>
          <p className="text-2xl font-bold text-purple-600">{totalAdmins}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Active Users</h3>
          <p className="text-2xl font-bold text-green-600">{totalActiveUsers}</p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-sm text-muted-foreground">Total Platform Balance</h3>
          <p className="text-2xl font-bold text-yellow-600">${totalBalance.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="border-b px-6 py-4 bg-muted/30">
          <h2 className="text-lg font-semibold">All Users</h2>
          <p className="text-sm text-muted-foreground">Complete list of platform users</p>
        </div>
        
        {!users || users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">User</th>
                  <th className="text-left p-3 text-sm font-medium">Role</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-right p-3 text-sm font-medium">Balance</th>
                  <th className="text-right p-3 text-sm font-medium">Referrals</th>
                  <th className="text-left p-3 text-sm font-medium">Joined</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const wallet = user.wallets?.[0];
                  const referralCount = referralCountMap.get(user.id) || 0;
                  
                  return (
                    <tr key={user.id} className="border-t hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium">{user.full_name || 'No name'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                        {user.phone && (
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        )}
                       </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full
                          ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : ''}
                          ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : ''}
                          ${user.role === 'member' ? 'bg-green-100 text-green-800' : ''}
                        `}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role}
                        </span>
                       </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full
                          ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        `}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                       </td>
                      <td className="p-3 text-right">
                        <div className="font-medium">${wallet?.available_balance?.toFixed(2) || '0'}</div>
                        <div className="text-xs text-muted-foreground">
                          Locked: ${wallet?.locked_balance?.toFixed(2) || '0'}
                        </div>
                       </td>
                      <td className="p-3 text-right">
                        <div className="font-medium">{referralCount}</div>
                        <div className="text-xs text-muted-foreground">
                          Code: {user.referral_code}
                        </div>
                       </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                       </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            View
                          </Link>
                          <form action={`/api/admin/users/${user.id}/toggle-status`} method="POST">
                            <button className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">
                              {user.is_active ? 'Suspend' : 'Activate'}
                            </button>
                          </form>
                          {user.role !== 'super_admin' && (
                            <form action={`/api/admin/users/${user.id}/make-admin`} method="POST">
                              <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                                Make Admin
                              </button>
                            </form>
                          )}
                        </div>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}