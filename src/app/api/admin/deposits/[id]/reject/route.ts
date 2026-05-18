import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    
    // Await the params (Next.js 15+ requirement)
    const { id } = await params;
    
    console.log('=== REJECT DEBUG ===');
    console.log('1. params.id:', id);
    
    if (!id || id === 'undefined') {
      console.error('Invalid deposit ID:', id);
      return NextResponse.json(
        { error: 'Invalid deposit ID' },
        { status: 400 }
      );
    }
    
    // Get the deposit
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !deposit) {
      console.error('Deposit not found:', fetchError);
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      );
    }
    
    const userId = deposit.user_id;
    
    // Update deposit status to rejected
    const { error: depositError } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
      })
      .eq('id', id);
    
    if (depositError) {
      console.error('Deposit reject error:', depositError);
      return NextResponse.json(
        { error: depositError.message },
        { status: 500 }
      );
    }
    
    // Record ledger entry for rejected deposit
    if (userId) {
      await supabase
        .from('wallet_ledger')
        .insert({
          user_id: userId,
          type: 'deposit_rejected',
          amount: 0,
          description: `Deposit rejected`,
          reference_id: id,
        });
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