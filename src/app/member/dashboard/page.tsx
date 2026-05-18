import { getCurrentProfile } from "@/services/profile-service";
import { getCurrentWallet } from "@/services/wallet-service";
import { getMyActiveCommitments, getMySettledSessions } from "@/services/session-service";
import { createClient } from "@/lib/supabase/server";
import { getUSDToNGNRate, convertUSDtoNGN } from "@/services/exchange-rate-service";
import Link from "next/link";

export default async function MemberDashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const wallet = await getCurrentWallet();
  const { commitments } = await getMyActiveCommitments();
  const { history } = await getMySettledSessions();

  const totalLocked = commitments?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
  
  const { data: withdrawalOptions } = await supabase
    .from('withdrawal_options')
    .select('id')
    .eq('user_id', profile?.id)
    .eq('is_active', true);
  
  const hasWithdrawalOptions = withdrawalOptions && withdrawalOptions.length > 0;
  
  const exchangeRate = await getUSDToNGNRate();
  const ngnBalance = await convertUSDtoNGN(wallet?.available_balance || 0);
  const ngnProfit = await convertUSDtoNGN(wallet?.profit_balance || 0);
  const ngnReferral = await convertUSDtoNGN(wallet?.referral_balance || 0);

  return (
    <div className="space-y-6">
      {!hasWithdrawalOptions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">Warning</span>
            <div>
              <h3 className="font-semibold text-yellow-800">Withdrawal Options Not Set</h3>
              <p className="text-sm text-yellow-700">
                You haven't set up your withdrawal options yet. You won't be able to withdraw funds until you configure at least one withdrawal method.
              </p>
              <Link
                href="/member/withdrawal-options"
                className="inline-block mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              >
                Set Withdrawal Options
              </Link>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground">{profile?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Main Balance</h2>
          <p className="mt-2 text-3xl font-bold">${wallet?.available_balance ?? 0}</p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Locked Balance</h2>
          <p className="mt-2 text-3xl font-bold text-yellow-600">${totalLocked.toFixed(2)}</p>
          {commitments?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{commitments.length} active session(s)</p>
          )}
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Profit Balance</h2>
          <p className="mt-2 text-3xl font-bold text-green-600">${wallet?.profit_balance ?? 0}</p>
        </div>

        <div className="rounded-xl border p-6">
          <h2 className="text-sm text-muted-foreground">Referral Balance</h2>
          <p className="mt-2 text-3xl font-bold text-blue-600">${wallet?.referral_balance ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <h2 className="text-sm text-muted-foreground">Naira Equivalent (NGN)</h2>
        <p className="mt-2 text-3xl font-bold text-green-600">
          ₦{ngnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Rate: 1 USD = ₦{exchangeRate.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Updates every 15 minutes</p>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-500">
          <span>Profit: ₦{ngnProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span>Referral: ₦{ngnReferral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {commitments && commitments.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Your Active Commitments</h2>
            <p className="text-sm text-muted-foreground">Funds currently locked in trading sessions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Session</th>
                  <th className="text-right p-3 text-sm font-medium">Your Commitment</th>
                  <th className="text-right p-3 text-sm font-medium">Pool Share</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Committed</th>
                </tr>
              </thead>
              <tbody>
                {commitments.map((commitment: any) => (
                  <tr key={commitment.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{commitment.session?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Pool: ${commitment.session?.total_committed?.toFixed(2) || '0'}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${commitment.amount?.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      {commitment.contribution_pct?.toFixed(2)}%
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full
                        ${commitment.session?.status === 'committed' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${commitment.session?.status === 'trading' ? 'bg-blue-100 text-blue-800' : ''}
                        ${commitment.session?.status === 'settlement' ? 'bg-purple-100 text-purple-800' : ''}
                      `}>
                        {commitment.session?.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(commitment.committed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {history && history.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Past Performance</h2>
            <p className="text-sm text-muted-foreground">Settled sessions and payouts</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Session</th>
                  <th className="text-right p-3 text-sm font-medium">Your Share</th>
                  <th className="text-right p-3 text-sm font-medium">Gross P&L</th>
                  <th className="text-right p-3 text-sm font-medium">Platform Cut</th>
                  <th className="text-right p-3 text-sm font-medium">Your Payout</th>
                  <th className="text-left p-3 text-sm font-medium">Settled</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record: any) => (
                  <tr key={record.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{record.session?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Session P&L: ${record.session?.total_profit_loss?.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {record.contribution_pct?.toFixed(2)}%
                    </td>
                    <td className={`p-3 text-right ${record.gross_pnl_share >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${record.gross_pnl_share?.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-gray-500">
                      ${record.platform_cut?.toFixed(2)}
                    </td>
                    <td className={`p-3 text-right font-medium ${record.net_payout >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${record.net_payout?.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(record.calculated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Link
          href="/member/sessions"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Browse Available Sessions
        </Link>
        <Link
          href="/member/commitments"
          className="px-4 py-2 border rounded-lg hover:bg-muted"
        >
          View All Commitments
        </Link>
        <Link
          href="/member/withdraw"
          className="px-4 py-2 border rounded-lg hover:bg-muted"
        >
          Withdraw Funds
        </Link>
      </div>
    </div>
  );
}