'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PixelLanding from '@/components/PixelLanding';
import HomeHub from '@/components/HomeHub';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(true);

  const handleLandingComplete = useCallback(() => {
    setShowLanding(false);
  }, []);

  // Redirect to login after landing is done and auth check is complete
  useEffect(() => {
    if (!showLanding && !loading && !user) {
      router.push('/login');
    }
  }, [showLanding, loading, user, router]);

  // Always show Pixel Landing first (regardless of auth)
  if (showLanding) {
    return <PixelLanding onComplete={handleLandingComplete} />;
  }

  // After landing: show loading while checking auth
  if (loading || !user) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="spinner" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Authenticated: show Home hub
  return <HomeHub />;
}
