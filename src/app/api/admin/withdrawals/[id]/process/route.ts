import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Get withdrawal details
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();
    
    // Update withdrawal status
    await supabase
      .from('withdrawals')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    // Deduct from wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('available_balance')
      .eq('user_id', withdrawal.user_id)
      .single();
    
    await supabase
      .from('wallets')
      .update({
        available_balance: (wallet.available_balance || 0) - withdrawal.amount_usd,
      })
      .eq('user_id', withdrawal.user_id);
    
    // Record ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal_processed',
        amount: -withdrawal.net_amount,
        description: `Withdrawal processed: $${withdrawal.net_amount}`,
        reference_id: id,
      });
    
    return NextResponse.redirect(new URL('/admin/withdrawals', request.url));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}