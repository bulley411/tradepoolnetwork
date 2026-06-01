import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const adminSupabase = createAdminClient();
    
    // Verify admin is authenticated
    const { data: { user: adminUser } } = await adminSupabase.auth.getUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if target user exists and is active
    const { data: targetUser, error: userError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, is_active')
      .eq('id', id)
      .single();
    
    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!targetUser.is_active) {
      return NextResponse.json({ error: 'Cannot impersonate a suspended user' }, { status: 403 });
    }
    
    // Generate a unique session token
    const sessionToken = randomBytes(32).toString('hex');
    
    // Create impersonation session
    const { error: insertError } = await adminSupabase
      .from('impersonation_sessions')
      .insert({
        admin_id: adminUser.id,
        target_user_id: id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    
    if (insertError) {
      console.error('Error creating impersonation session:', insertError);
      return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 });
    }
    
    // Create response with impersonation cookie
    const response = NextResponse.redirect(new URL('/member/dashboard', request.url));
    
    // Set impersonation cookie (this will be used by middleware to determine which user to show)
    response.cookies.set('impersonate_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
    
    return response;
    
  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}