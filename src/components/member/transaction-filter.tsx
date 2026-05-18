'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function TransactionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';

  function handleTypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('type');
    } else {
      params.set('type', value);
    }
    router.push(`/member/wallet?${params.toString()}`);
  }

  return (
    <select
      value={currentType}
      onChange={(e) => handleTypeChange(e.target.value)}
      className="px-3 py-2 border rounded-lg text-sm"
    >
      <option value="all">All Transactions</option>
      <option value="deposit_credited">Deposits</option>
      <option value="withdrawal_processed">Withdrawals</option>
      <option value="session_locked">Commitments</option>
      <option value="pnl_payout">Profit Payouts</option>
      <option value="commission_earned">Referral Commissions</option>
    </select>
  );
}