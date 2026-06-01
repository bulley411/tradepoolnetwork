import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-Impersonate-User': (() => {
            // This will only run on client side
            if (typeof document !== 'undefined') {
              const match = document.cookie.match(/impersonate_user_id=([^;]+)/);
              return match ? match[1] : '';
            }
            return '';
          })(),
        },
      },
    }
  );
}