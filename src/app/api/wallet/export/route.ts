import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get all transactions
  const { data: transactions } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ error: 'No transactions found' }, { status: 404 });
  }
  
  // Create CSV content
  const headers = ['Date', 'Type', 'Description', 'Amount (USD)', 'Balance After (USD)'];
  const rows = transactions.map(tx => [
    new Date(tx.created_at).toLocaleString(),
    tx.type,
    tx.description || tx.type,
    tx.amount.toFixed(2),
    tx.balance_after?.toFixed(2) || '0',
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  // Return as CSV file
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="wallet_transactions_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}