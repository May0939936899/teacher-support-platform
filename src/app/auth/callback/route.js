// OAuth callback handler — exchanges authorization code for Supabase session
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/teacher';
  const errorParam = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Handle OAuth errors from provider
  if (errorParam) {
    console.error('OAuth error:', errorParam, errorDesc);
    return NextResponse.redirect(`${origin}/teacher/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            } catch (err) {
              // Ignore cookie errors in middleware context
              console.warn('Cookie set warning:', err.message);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('OAuth code exchange error:', error.message);
  }

  // Redirect to login on missing code or exchange failure
  return NextResponse.redirect(`${origin}/teacher/login?error=auth`);
}
