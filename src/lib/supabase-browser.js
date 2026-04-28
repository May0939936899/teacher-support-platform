// Supabase client for browser (client components)
import { createBrowserClient } from '@supabase/ssr';

let client = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build-time prerendering, env vars may not be available
  if (!url || !key) {
    // Return a minimal stub that won't crash during SSR/build
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => {},
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
      }),
    };
  }

  if (!client) {
    client = createBrowserClient(url, key);
  }
  return client;
}
