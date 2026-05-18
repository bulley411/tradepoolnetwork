import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    console.log('Approving withdrawal:', id);
    
    // Update withdrawal status to approved
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Approve error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.redirect(new URL('/admin/withdrawals', request.url));
    
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}