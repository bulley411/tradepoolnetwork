import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    console.log('Processing withdrawal:', id);
    
    // Get withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !withdrawal) {
      console.error('Withdrawal not found:', fetchError);
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    console.log('Withdrawal found:', withdrawal);
    
    // Update withdrawal status to processed
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('available_balance')
      .eq('user_id', withdrawal.user_id)
      .single();
    
    if (walletError) {
      console.error('Wallet fetch error:', walletError);
    }
    
    // Deduct from wallet balance (only if not already deducted)
    if (wallet) {
      const { error: deductError } = await supabase
        .from('wallets')
        .update({
          available_balance: (wallet.available_balance || 0) - withdrawal.amount_usd,
        })
        .eq('user_id', withdrawal.user_id);
      
      if (deductError) {
        console.error('Deduct error:', deductError);
      }
    }
    
    // Record ledger entry
    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert({
        user_id: withdrawal.user_id,
        type: 'withdrawal_processed',
        amount: -withdrawal.amount_usd,
        balance_after: (wallet?.available_balance || 0) - withdrawal.amount_usd,
        description: `Withdrawal processed: $${withdrawal.amount_usd}${withdrawal.fee > 0 ? ` (fee: $${withdrawal.fee.toFixed(2)})` : ''}`,
        reference_id: id,
      });
    
    if (ledgerError) {
      console.error('Ledger error:', ledgerError);
    }
    
    return NextResponse.redirect(new URL('/admin/withdrawals', request.url));
    
  } catch (error) {
    console.error('Process withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}