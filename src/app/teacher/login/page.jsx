'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TeacherLoginContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div style={styles.page}>
      <Loader2 size={32} style={{ color: '#0d9488', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function TeacherLoginContent() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lang, setLang] = useState('th');

  const txt = {
    th: {
      title: 'Teacher Support Platform',
      sub: 'ระบบสนับสนุนการสอนสำหรับอาจารย์มหาวิทยาลัย',
      orgName: 'คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม',
      login: 'เข้าสู่ระบบ',
      register: 'สมัครสมาชิก',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
      confirmPwd: 'ยืนยันรหัสผ่าน',
      googleLogin: 'เข้าสู่ระบบด้วย Google',
      googleRegister: 'สมัครด้วย Google',
      or: 'หรือ',
      submit_login: 'เข้าสู่ระบบ',
      submit_register: 'สมัครสมาชิก',
      features: ['ออกข้อสอบ + QR Code', 'ตรวจ Plagiarism & AI Content', 'เช็คชื่อด้วย GPS', 'เขียนจดหมายราชการ AI', 'สรุปการประชุม AI'],
    },
    en: {
      title: 'Teacher Support Platform',
      sub: 'University Teaching Support System',
      orgName: 'Business School, Sripatum University',
      login: 'Sign In',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPwd: 'Confirm Password',
      googleLogin: 'Sign in with Google',
      googleRegister: 'Sign up with Google',
      or: 'or',
      submit_login: 'Sign In',
      submit_register: 'Sign Up',
      features: ['Quiz + QR Code', 'Plagiarism & AI Detector', 'GPS Attendance', 'AI Letter Writer', 'AI Meeting Notes'],
    },
  }[lang];

  useEffect(() => {
    if (!loading && user) router.push('/teacher');
  }, [user, loading, router]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setMessage({ type: 'error', text: 'การเข้าสู่ระบบผิดพลาด กรุณาลองใหม่' });
  }, [searchParams]);

  if (loading) return <LoadingScreen />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' }); return; }
    if (tab === 'register' && password !== confirmPassword) { setMessage({ type: 'error', text: 'รหัสผ่านไม่ตรงกัน' }); return; }
    if (password.length < 6) { setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }); return; }
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (tab === 'register') {
        await signUpWithEmail(email, password);
        setMessage({ type: 'success', text: '✅ สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบ Email ยืนยันตัวตนก่อน' });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) setMessage({ type: 'error', text: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
      else if (msg.includes('Email not confirmed')) setMessage({ type: 'error', text: 'กรุณายืนยัน Email ก่อนเข้าสู่ระบบ' });
      else setMessage({ type: 'error', text: msg || 'เกิดข้อผิดพลาด' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.container}>
        {/* Left panel */}
        <div style={styles.leftPanel}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>{txt.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{txt.orgName}</div>
              </div>
            </div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>
              สอนได้ดีขึ้น<br />ด้วย AI
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              {txt.sub}<br />35 เครื่องมือ ใน 3 ด้าน 8 หมวด
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {txt.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                  {['📝', '🔍', '📅', '✉️', '🗒️'][i]}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginBottom: '4px' }}>เครื่องมือที่พร้อมใช้งาน</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '32px' }}>7 / 35</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Phase 1 Complete</div>
          </div>
        </div>

        {/* Right panel - Login card */}
        <div style={styles.rightPanel}>
          {/* Language toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '2px', display: 'flex' }}>
              {['th', 'en'].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: lang === l ? '#fff' : 'none', color: lang === l ? '#0d9488' : '#94a3b8',
                  fontWeight: lang === l ? 700 : 400, fontSize: '12px', fontFamily: 'inherit',
                  boxShadow: lang === l ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>
                  {l === 'th' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            {[{ id: 'login', label: txt.login }, { id: 'register', label: txt.register }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setMessage({ type: '', text: '' }); }} style={{
                flex: 1, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? '#fff' : 'none',
                color: tab === t.id ? '#0d9488' : '#64748b',
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: '14px', fontFamily: 'inherit',
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Google login */}
          <button onClick={signInWithGoogle} style={styles.googleBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {tab === 'login' ? txt.googleLogin : txt.googleRegister}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{txt.or}</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={styles.label}>{txt.email}</label>
              <input type="email" placeholder="example@gmail.com" value={email}
                onChange={e => setEmail(e.target.value)} disabled={submitting}
                style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>{txt.password}</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} disabled={submitting}
                style={styles.input} />
            </div>
            {tab === 'register' && (
              <div>
                <label style={styles.label}>{txt.confirmPwd}</label>
                <input type="password" placeholder="••••••••" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} disabled={submitting}
                  style={styles.input} />
              </div>
            )}

            {message.text && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                color: message.type === 'error' ? '#dc2626' : '#16a34a',
                border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
              }}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{
              padding: '12px', borderRadius: '10px', border: 'none',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #0d9488, #2563eb)',
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '15px', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {submitting ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> กำลังดำเนินการ...</>
              ) : (tab === 'login' ? txt.submit_login : txt.submit_register)}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f0fdfa', fontFamily: "'Noto Sans Thai', 'Inter', sans-serif", padding: '20px',
    position: 'relative', overflow: 'hidden',
  },
  bgDecor1: {
    position: 'fixed', top: '-100px', left: '-100px', width: '400px', height: '400px',
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.15), transparent)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'fixed', bottom: '-100px', right: '-100px', width: '400px', height: '400px',
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent)',
    pointerEvents: 'none',
  },
  container: {
    display: 'flex', borderRadius: '24px', overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.15)', maxWidth: '900px', width: '100%',
    position: 'relative', zIndex: 1,
  },
  leftPanel: {
    background: 'linear-gradient(145deg, #0d9488 0%, #0891b2 50%, #2563eb 100%)',
    padding: '40px 36px', flex: '0 0 380px', display: 'flex', flexDirection: 'column',
  },
  rightPanel: {
    background: '#fff', padding: '40px 36px', flex: 1, minWidth: '320px',
  },
  googleBtn: {
    width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', color: '#374151', transition: 'all 0.2s',
  },
  label: {
    fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '5px',
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', outline: 'none', color: '#1e293b', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
};
