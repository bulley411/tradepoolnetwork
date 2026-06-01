import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    
    // Clear impersonation cookies
    response.cookies.delete('impersonate_user_id');
    response.cookies.delete('impersonate_admin_id');
    
    return response;
  } catch (error) {
    console.error('Stop impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}