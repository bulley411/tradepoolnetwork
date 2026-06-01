import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
  
  // Get the impersonation token to deactivate
  const impersonateToken = request.cookies.get('impersonate_token')?.value;
  
  if (impersonateToken) {
    try {
      const supabase = createAdminClient();
      // Deactivate the impersonation session
      await supabase
        .from('impersonation_sessions')
        .update({ is_active: false })
        .eq('session_token', impersonateToken);
    } catch (error) {
      console.error('Error deactivating impersonation session:', error);
    }
  }
  
  // Clear impersonation cookie
  response.cookies.delete('impersonate_token');
  
  return response;
}