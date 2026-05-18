// Record ledger entry - show full withdrawal amount, not net
await supabase
  .from('wallet_ledger')
  .insert({
    user_id: withdrawal.user_id,
    type: 'withdrawal_processed',
    amount: -withdrawal.amount_usd,  // Full amount, not net
    balance_after: (wallet.available_balance - withdrawal.amount_usd),
    description: `Withdrawal of $${withdrawal.amount_usd} processed${withdrawal.fee > 0 ? ` (fee: $${withdrawal.fee.toFixed(2)})` : ''}`,
    reference_id: id,
  });