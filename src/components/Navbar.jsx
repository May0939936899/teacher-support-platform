'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Shield, Wand2, ImageIcon, Home, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, profile, loading, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', icon: <Home size={16} />, label: 'หน้าหลัก', id: 'home' },
    { href: '/content', icon: <ImageIcon size={16} />, label: 'Content', id: 'content' },
    { href: '/poster', icon: <Wand2 size={16} />, label: 'Poster', id: 'poster', disabled: true },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Left: Logo — links to home */}
        <Link href="/" className="navbar__logo-link" title="กลับหน้าหลัก">
          <img src="/spu-bus-logo.png" alt="SPU Business School" className="navbar__logo" />
        </Link>

        {/* Divider */}
        {user && <div className="navbar__divider" />}

        {/* Center: Nav links (desktop) */}
        {user && (
          <div className="navbar__links" style={{ marginLeft:'auto' }}>
            {navLinks.map(link => (
              link.disabled ? (
                <span
                  key={link.id}
                  className="navbar__link navbar__link--disabled"
                  title="กำลังปรับปรุง"
                  style={{ opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </span>
              ) : (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`navbar__link ${isActive(link.href) ? 'navbar__link--active' : ''}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`navbar__link navbar__link--admin ${isActive('/admin') ? 'navbar__link--active' : ''}`}
              >
                <Shield size={16} />
                <span>Admin</span>
              </Link>
            )}
          </div>
        )}

        {/* Right: User section */}
        <div className="navbar__right">
          {loading ? (
            <div className="navbar__skeleton" />
          ) : user ? (
            <>
              <div className="navbar__user">
                <div className="navbar__avatar-wrap">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="navbar__avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="navbar__avatar-fallback"><User size={14} /></div>
                  )}
                </div>
                <span className="navbar__username">{profile?.full_name || user.email}</span>
              </div>
              <button onClick={signOut} className="navbar__logout" title="ออกจากระบบ">
                <LogOut size={16} />
              </button>

              {/* Mobile hamburger */}
              <button
                className="navbar__hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                title="เมนู"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <button onClick={signInWithGoogle} className="navbar__google-btn">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              เข้าสู่ระบบด้วย Google
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && user && (
        <div className="navbar__mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.id}
              href={link.href}
              className={`navbar__mobile-link ${isActive(link.href) ? 'navbar__mobile-link--active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="navbar__mobile-link">
              <Shield size={16} />
              <span>Admin</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
