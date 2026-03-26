'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrCreateProfile(session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchOrCreateProfile(authUser) {
    try {
      // Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        // Profile exists — check if needs updating (e.g. avatar from Google)
        const meta = authUser.user_metadata || {};
        const needsUpdate =
          (!data.avatar_url && meta.avatar_url) ||
          (!data.full_name && (meta.full_name || meta.name));

        if (needsUpdate) {
          const updates = {};
          if (!data.avatar_url && meta.avatar_url) updates.avatar_url = meta.avatar_url;
          if (!data.full_name && (meta.full_name || meta.name)) updates.full_name = meta.full_name || meta.name;

          const { data: updated } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', authUser.id)
            .select()
            .single();

          setProfile(updated || data);
        } else {
          setProfile(data);
        }
      } else if (error && (error.code === 'PGRST116' || error.message?.includes('no rows'))) {
        // Profile doesn't exist — create one
        const meta = authUser.user_metadata || {};
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name: meta.full_name || meta.name || authUser.email?.split('@')[0] || '',
          avatar_url: meta.avatar_url || meta.picture || '',
          role: 'user',
        };

        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) {
          console.warn('Could not create profile:', insertError.message);
          // Still set a local profile so the app works
          setProfile(newProfile);
        } else {
          setProfile(created);
        }
      } else {
        // Some other error — still try to work with user metadata
        const meta = authUser.user_metadata || {};
        setProfile({
          id: authUser.id,
          email: authUser.email,
          full_name: meta.full_name || meta.name || '',
          avatar_url: meta.avatar_url || meta.picture || '',
          role: 'user',
        });
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
      // Fallback — construct profile from auth user metadata
      const meta = authUser.user_metadata || {};
      setProfile({
        id: authUser.id,
        email: authUser.email,
        full_name: meta.full_name || meta.name || '',
        avatar_url: meta.avatar_url || meta.picture || '',
        role: 'user',
      });
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }

  async function signUpWithEmail(email, password) {
    // Use server API to create user with email auto-confirmed (no verification email)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    // Auto sign in after successful registration
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      isAdmin: profile?.role === 'admin',
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      signOut,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
