import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  // Create a regular Supabase client for auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check for impersonation token
  const impersonateToken = request.cookies.get("impersonate_token")?.value;
  let impersonatedUserId: string | null = null;
  
  if (impersonateToken) {
    // Verify the token with the database
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: session, error } = await adminSupabase
      .from("impersonation_sessions")
      .select("target_user_id, expires_at")
      .eq("session_token", impersonateToken)
      .eq("is_active", true)
      .single();
    
    if (session && !error && new Date(session.expires_at) > new Date()) {
      impersonatedUserId = session.target_user_id;
      // Add header so server components know we're impersonating
      response.headers.set("x-impersonate-user", impersonatedUserId);
      response.headers.set("x-impersonate-active", "true");
    } else {
      // Token expired or invalid, clear the cookie
      response.cookies.delete("impersonate_token");
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/member") ||
    pathname.startsWith("/admin");

  // If not logged in and trying to access protected route, redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and on login page, redirect to appropriate dashboard
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/member/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/login"],
};