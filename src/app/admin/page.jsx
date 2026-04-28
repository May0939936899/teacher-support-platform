'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/teacher/login');
      else if (profile?.role !== 'admin') router.push('/teacher');
    }
  }, [user, profile, loading, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0b24' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #00b4e630', borderTopColor: '#00b4e6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b24', color: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '16px' }}>Admin Dashboard</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Welcome, {profile?.email}</p>
    </div>
  );
}
