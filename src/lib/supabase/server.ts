import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const isImpersonating = headersList.get('x-impersonate-active') === 'true';
  const impersonatedUserId = headersList.get('x-impersonate-user');
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle error
          }
        },
      },
      global: {
        headers: {
          ...(isImpersonating && impersonatedUserId ? { 'X-Impersonate-User': impersonatedUserId } : {}),
        },
      },
    }
  );
}