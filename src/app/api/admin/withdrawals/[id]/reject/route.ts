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
    const userId = formData.get('user_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    
    // Update withdrawal status
    await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    // Return funds to wallet (no deduction)
    // Wallet balance remains unchanged since it wasn't deducted yet
    
    // Record ledger entry for rejection
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: userId,
        type: 'withdrawal_rejected',
        amount: 0,
        description: `Withdrawal rejected: $${amount}`,
        reference_id: id,
      });
    
    return NextResponse.redirect(new URL('/admin/withdrawals', request.url));
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}