import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const impersonateUserId = request.cookies.get('impersonate_user_id')?.value;
    
    if (!impersonateUserId) {
      return NextResponse.json({ error: 'Not impersonating' }, { status: 404 });
    }
    
    const supabase = createAdminClient();
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', impersonateUserId)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ email: user.email, full_name: user.full_name });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}