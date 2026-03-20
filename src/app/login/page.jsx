'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-page"><Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // type: 'error'|'success'

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);

  // Show OAuth error from redirect
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth') {
      setMessage({ type: 'error', text: 'การเข้าสู่ระบบผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    } else if (error) {
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${error}` });
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="login-page">
        <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage({ type: '', text: '' });
    setShowPassword(false);
    setShowConfirm(false);
  }

  function switchTab(t) {
    setTab(t);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!email || !password) {
      setMessage({ type: 'error', text: 'กรุณากรอก Email และ Password' });
      return;
    }
    if (tab === 'register' && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password ไม่ตรงกัน กรุณากรอกใหม่' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' });
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'register') {
        await signUpWithEmail(email, password);
        setMessage({ type: 'success', text: '✅ สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบ Email เพื่อยืนยันตัวตนก่อนเข้าสู่ระบบ' });
        setPassword('');
        setConfirmPassword('');
      } else {
        await signInWithEmail(email, password);
        // router.push('/') will trigger via useEffect when user state updates
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setMessage({ type: 'error', text: 'Email หรือ Password ไม่ถูกต้อง กรุณาลองใหม่' });
      } else if (msg.includes('Email not confirmed')) {
        setMessage({ type: 'error', text: '📧 กรุณาเปิด Email แล้วกดลิงก์ยืนยันก่อน จึงจะเข้าสู่ระบบได้' });
      } else if (msg.includes('User already registered')) {
        setMessage({ type: 'error', text: 'Email นี้มีผู้ใช้งานแล้ว กรุณาไปที่แท็บ "เข้าสู่ระบบ"' });
      } else if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')) {
        setMessage({ type: 'error', text: 'ส่ง Email บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
      } else {
        setMessage({ type: 'error', text: msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logos */}
        <div className="login-logos">
          <img src="/spu-bus-logo.png" alt="SPU Business School" className="login-logo" />
          <img src="/ai-club-logo.png" alt="AI Business Talent Club" className="login-logo" />
        </div>

        {/* Brand */}
        <div className="login-brand">
          <h1><span className="text-gradient">SPUBUS BIZ CONTENT</span></h1>
          <p>AI-Powered Content Generator</p>
          <p className="login-sub">คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
            type="button"
          >
            สมัครสมาชิก
          </button>
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
            type="button"
          >
            เข้าสู่ระบบ
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Gmail / Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                disabled={submitting}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password (register only) */}
          {tab === 'register' && (
            <div className="auth-field">
              <label className="auth-label">ยืนยัน Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="กรอก Password อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`auth-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="auth-submit-btn" disabled={submitting}>
            {submitting
              ? <Loader2 size={18} className="spinner" />
              : tab === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'
            }
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>หรือ</span>
        </div>

        {/* Google OAuth */}
        <button onClick={signInWithGoogle} className="google-login-btn" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {tab === 'register' ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
        </button>

      </div>
    </div>
  );
}
