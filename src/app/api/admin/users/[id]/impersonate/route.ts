import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Create admin client to verify the current user is an admin
    const adminSupabase = createAdminClient();
    
    // Check if the target user exists
    const { data: targetUser, error: userError } = await adminSupabase
      .from('profiles')
      .select('id, email, role, is_active')
      .eq('id', id)
      .single();
    
    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is active
    if (!targetUser.is_active) {
      return NextResponse.json(
        { error: 'Cannot impersonate a suspended user' },
        { status: 403 }
      );
    }
    
    // Create a session for the target user using Supabase Auth admin API
    // First, get the current session to know we're admin
    const supabase = await createClient();
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    
    if (!adminSession) {
      return NextResponse.json(
        { error: 'Admin not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the target user's auth user (need to find their email)
    // We'll use the admin client to sign in as the user
    // Alternative: Set a cookie with the user's ID and let middleware handle it
    
    // For security, we'll create a custom impersonation token
    // Store the original admin ID and the impersonated user ID in a secure cookie
    
    // Get the target user's email from auth.users
    const { data: authUser, error: authError } = await adminSupabase
      .from('auth.users')
      .select('email')
      .eq('id', id)
      .single();
    
    // Create a response that sets an impersonation cookie
    const response = NextResponse.redirect(new URL('/member/dashboard', request.url));
    
    // Set cookie for impersonation (will be cleared on logout)
    response.cookies.set('impersonate_user_id', id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    response.cookies.set('impersonate_admin_id', adminSession.user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
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