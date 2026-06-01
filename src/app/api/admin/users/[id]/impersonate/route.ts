import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use regular server client to get the current session
    const supabase = await createClient();
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !adminUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Please login as admin first' }, { status: 401 });
    }
    
    // Verify admin role using admin client
    const adminSupabase = createAdminClient();
    const { data: adminProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError || !adminProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 });
    }
    
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
    
    // Create or update impersonation session in database
    const { error: insertError } = await adminSupabase
      .from('impersonation_sessions')
      .insert({
        admin_id: adminUser.id,
        target_user_id: id,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });
    
    if (insertError) {
      console.error('Error creating impersonation session:', insertError);
      return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 });
    }
    
    // Create response with redirect to member dashboard
    const response = NextResponse.redirect(new URL('/member/dashboard', request.url));
    
    // Set impersonation cookie
    response.cookies.set('impersonate_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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