import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    const amount = parseFloat(formData.get('amount') as string);
    
    // Await the params (Next.js 15+ requirement)
    const { id } = await params;
    
    console.log('=== APPROVE DEBUG ===');
    console.log('1. params.id:', id);
    console.log('2. amount from form:', amount);
    
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
      .select('*')
      .eq('id', id)
      .single();
    
    console.log('3. Deposit found:', deposit);
    
    if (fetchError || !deposit) {
      console.error('Deposit not found:', fetchError);
      return NextResponse.json(
        { error: `Deposit not found` },
        { status: 404 }
      );
    }
    
    const userId = deposit.user_id;
    const depositAmount = amount || deposit.amount || 0;
    
    // Update deposit status
    const { error: depositError } = await supabase
      .from('deposits')
      .update({
        status: 'confirmed',
        amount: depositAmount,
      })
      .eq('id', id);
    
    if (depositError) {
      console.error('Deposit update error:', depositError);
      return NextResponse.json(
        { error: depositError.message },
        { status: 500 }
      );
    }
    
    // Update wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('available_balance')
      .eq('user_id', userId)
      .single();
    
    if (wallet) {
      await supabase
        .from('wallets')
        .update({ 
          available_balance: (wallet.available_balance || 0) + depositAmount 
        })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('wallets')
        .insert({ 
          user_id: userId, 
          available_balance: depositAmount,
          locked_balance: 0,
          profit_balance: 0,
          referral_balance: 0
        });
    }
    
    // Record ledger entry
    await supabase
      .from('wallet_ledger')
      .insert({
        user_id: userId,
        type: 'deposit_credited',
        amount: depositAmount,
        description: `Deposit approved: $${depositAmount}`,
        reference_id: id,
      });
    
    return NextResponse.redirect(new URL('/admin/deposits', request.url));
    
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}