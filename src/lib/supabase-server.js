// Supabase client for server-side (API routes, server components)
// Uses service role key for admin operations
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || key === 'your-service-role-key-here') {
    return null; // Caller must handle null
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

// Get user from authorization header (for API routes)
export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Check if user is admin
export function isAdminEmail(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return adminEmails.includes(email?.toLowerCase());
}
