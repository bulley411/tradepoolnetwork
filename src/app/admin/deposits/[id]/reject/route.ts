import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    
    // Update deposit status to rejected
    const { error: depositError } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', params.id);
    
    if (depositError) {
      console.error('Deposit reject error:', depositError);
      return NextResponse.json(
        { error: depositError.message },
        { status: 500 }
      );
    }
    
    // Optional: Record ledger entry for rejected deposit
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: userId,
        type: 'deposit_rejected',
        amount: 0,
        description: `Deposit rejected`,
        reference_id: params.id,
      });
    
    if (ledgerError) {
      console.error('Ledger error:', ledgerError);
    }
    
    return NextResponse.redirect(new URL('/admin/deposits', request.url));
    
  } catch (error) {
    console.error('Reject error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}