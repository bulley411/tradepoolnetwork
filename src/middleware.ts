import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if impersonation is active
  const impersonateUserId = request.cookies.get("impersonate_user_id")?.value;
  const impersonateAdminId = request.cookies.get("impersonate_admin_id")?.value;

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
    // If impersonating as admin, redirect to member dashboard but show impersonation banner
    if (impersonateUserId && impersonateAdminId === user.id) {
      return NextResponse.redirect(new URL("/member/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/member/dashboard", request.url));
  }

  // If impersonating, add headers to indicate impersonation mode
  if (impersonateUserId && impersonateAdminId && user?.id === impersonateAdminId) {
    // Add headers to identify impersonation
    response.headers.set("x-impersonate-user", impersonateUserId);
    response.headers.set("x-impersonate-active", "true");
  }

  // Also check for impersonation when accessing admin routes
  // If admin is impersonating, prevent access to admin routes (they should stop impersonation first)
  if (pathname.startsWith("/admin") && impersonateUserId && user?.id === impersonateAdminId) {
    // Still allow access to admin routes, but add a header
    response.headers.set("x-impersonate-active", "true");
    response.headers.set("x-impersonate-admin-warning", "true");
  }

  return response;
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/login"],
};