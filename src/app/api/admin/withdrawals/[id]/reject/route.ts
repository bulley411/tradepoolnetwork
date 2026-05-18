import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    const formData = await request.formData();
    const rejectionReason = formData.get('rejection_reason') as string || 'No reason provided';
    
    console.log('Rejecting withdrawal:', id);
    
    // Get withdrawal details to get user_id and amount
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('user_id, amount_usd')
      .eq('id', id)
      .single();
    
    if (fetchError || !withdrawal) {
      console.error('Withdrawal not found:', fetchError);
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    // Update withdrawal status to rejected
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Reject error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    // Record ledger entry for rejection (no deduction happens since withdrawal wasn't processed)
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal_rejected',
        amount: 0,
        description: `Withdrawal request rejected: $${withdrawal.amount_usd} - ${rejectionReason}`,
        reference_id: id,
      });
    
    if (ledgerError) {
      console.error('Ledger error:', ledgerError);
    }
    
    return NextResponse.redirect(new URL('/admin/withdrawals', request.url));
    
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}