'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

// CI Colors from SPUBUS logo
const CI = {
  cyan: '#00b4e6',
  magenta: '#e6007e',
  dark: '#0b0b24',
  gold: '#ffc107',
  purple: '#7c4dff',
};

export default function TeacherLoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TeacherLanding />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CI.dark }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${CI.cyan}30`, borderTopColor: CI.cyan, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// ===== BUS SPLASH SCREEN =====
function BusSplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 1;
      });
    }, 48);
    const timer = setTimeout(() => onFinish(), 5000);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [onFinish]);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0b24 0%, #1a1a4e 40%, #2d1b69 100%)',
      fontFamily: "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif",
      overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 9999,
    }}>
      <style>{`
        @keyframes busRun { 0% { transform: translateX(-250px); opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(calc(100vw + 250px)); opacity: 0; } }
        @keyframes busRun2 { 0% { transform: translateX(calc(100vw + 150px)) scaleX(-1); opacity: 0; } 5% { opacity: 0.4; } 90% { opacity: 0.4; } 100% { transform: translateX(-350px) scaleX(-1); opacity: 0; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes wheelSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes roadDash { 0% { background-position: 0 0; } 100% { background-position: -60px 0; } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
      `}</style>

      {/* Floating stars */}
      {[...Array(25)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? '3px' : '2px', height: i % 3 === 0 ? '3px' : '2px',
          borderRadius: '50%',
          background: i % 4 === 0 ? '#00b4e6' : i % 4 === 1 ? '#ffc107' : i % 4 === 2 ? '#e6007e' : '#fff',
          top: `${(i * 17 + 5) % 85}%`, left: `${(i * 23 + 10) % 90}%`,
          animation: `twinkle ${1.5 + (i % 3) * 0.8}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}

      {/* Logo */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out', marginBottom: '20px', zIndex: 2 }}>
        <img src="/logo-spubus.png" alt="SPUBUS" style={{ height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,180,230,0.4))' }} />
      </div>

      {/* Title */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both', zIndex: 2, textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{
          fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '0.05em',
          background: 'linear-gradient(90deg, #00b4e6, #7c4dff, #e6007e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          SPUBUS MAGIC
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>
          แพลตฟอร์ม AI เปลี่ยนห้องเรียนให้มีชีวิต
        </p>
      </div>

      {/* Road + Bus Scene */}
      <div style={{ position: 'relative', width: '100%', height: '120px', animation: 'fadeInUp 0.8s ease-out 0.4s both', zIndex: 2 }}>
        {/* Road */}
        <div style={{
          position: 'absolute', bottom: '20px', left: 0, right: 0, height: '40px',
          background: '#2a2a3e', borderTop: '3px solid #3a3a5e', borderBottom: '3px solid #1a1a2e',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', transform: 'translateY(-50%)',
            backgroundImage: 'repeating-linear-gradient(90deg, #ffc107 0px, #ffc107 20px, transparent 20px, transparent 40px)',
            backgroundSize: '60px 3px', animation: 'roadDash 0.8s linear infinite',
          }} />
        </div>

        {/* Main Bus */}
        <div style={{ position: 'absolute', bottom: '45px', animation: 'busRun 4s linear infinite' }}>
          <div style={{ animation: 'bounce 0.3s ease-in-out infinite', position: 'relative' }}>
            <svg width="140" height="65" viewBox="0 0 140 65">
              <rect x="5" y="10" width="130" height="40" rx="8" fill="#00b4e6" />
              <rect x="10" y="5" width="120" height="10" rx="5" fill="#0099cc" />
              <rect x="15" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="38" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="61" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="84" y="18" width="18" height="16" rx="3" fill="#e0f7ff" opacity="0.9" />
              <rect x="107" y="18" width="22" height="28" rx="3" fill="#0099cc" />
              <rect x="110" y="21" width="7" height="22" rx="2" fill="#e0f7ff" opacity="0.8" />
              <rect x="119" y="21" width="7" height="22" rx="2" fill="#e0f7ff" opacity="0.8" />
              <rect x="130" y="30" width="8" height="8" rx="2" fill="#ffc107" />
              <rect x="2" y="30" width="6" height="8" rx="2" fill="#e6007e" />
              <text x="50" y="44" fill="#fff" fontSize="9" fontWeight="800" fontFamily="sans-serif">SPU BUS</text>
              <rect x="5" y="48" width="130" height="4" rx="2" fill="#0088b3" />
              <circle cx="35" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="35" cy="55" r="4" fill="#555" />
              <circle cx="105" cy="55" r="9" fill="#1a1a2e" stroke="#3a3a5e" strokeWidth="2" />
              <circle cx="105" cy="55" r="4" fill="#555" />
              <g style={{ transformOrigin: '35px 55px', animation: 'wheelSpin 0.4s linear infinite' }}>
                <line x1="35" y1="49" x2="35" y2="61" stroke="#777" strokeWidth="1" />
                <line x1="29" y1="55" x2="41" y2="55" stroke="#777" strokeWidth="1" />
              </g>
              <g style={{ transformOrigin: '105px 55px', animation: 'wheelSpin 0.4s linear infinite' }}>
                <line x1="105" y1="49" x2="105" y2="61" stroke="#777" strokeWidth="1" />
                <line x1="99" y1="55" x2="111" y2="55" stroke="#777" strokeWidth="1" />
              </g>
              <circle cx="-5" cy="48" r="4" fill="rgba(255,255,255,0.15)" />
              <circle cx="-15" cy="45" r="6" fill="rgba(255,255,255,0.08)" />
            </svg>
          </div>
        </div>

        {/* Small bus (opposite direction) */}
        <div style={{ position: 'absolute', bottom: '30px', animation: 'busRun2 6s linear infinite', animationDelay: '1s' }}>
          <svg width="80" height="40" viewBox="0 0 140 65">
            <rect x="5" y="10" width="130" height="40" rx="8" fill="#e6007e" />
            <rect x="10" y="5" width="120" height="10" rx="5" fill="#cc006e" />
            <rect x="15" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="38" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="61" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="84" y="18" width="18" height="16" rx="3" fill="#ffe0f0" opacity="0.9" />
            <rect x="130" y="30" width="8" height="8" rx="2" fill="#ffc107" />
            <circle cx="35" cy="55" r="9" fill="#1a1a2e" />
            <circle cx="105" cy="55" r="9" fill="#1a1a2e" />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both', zIndex: 2, textAlign: 'center', marginTop: '20px' }}>
        <div style={{ width: '200px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            background: 'linear-gradient(90deg, #00b4e6, #7c4dff, #e6007e)',
            width: `${progress}%`, transition: 'width 0.1s linear',
          }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          กำลังเตรียมเครื่องมือ 35 รายการ...
        </p>
      </div>
    </div>
  );
}

function TeacherLanding() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSplash, setShowSplash] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lang, setLang] = useState('th');
  const [hoveredSection, setHoveredSection] = useState(null);

  const txt = {
    th: {
      hero_pre: 'AI-Powered Platform',
      hero_title_1: 'เครื่องมือ AI',
      hero_title_2: 'สำหรับอาจารย์ยุคใหม่',
      hero_desc: 'แพลตฟอร์มสนับสนุนการสอนครบวงจร 35 เครื่องมือ AI ใน 3 ด้าน 8 หมวด ช่วยให้อาจารย์ทำงานได้เร็วขึ้น ง่ายขึ้น และมีประสิทธิภาพมากขึ้น',
      org: 'คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม',
      cta: 'เข้าสู่ระบบ',
      cta_google: 'เข้าด้วย Google',
      // Sections
      sec_teaching: 'ด้านการสอน',
      sec_teaching_desc: 'Smart Quiz, Live Quiz, Lesson Planner, Exit Ticket และอีกมากมาย',
      sec_docs: 'เครื่องมือเอกสาร',
      sec_docs_desc: 'AI เขียนจดหมาย, สร้าง Slide, ตรวจ Plagiarism, แปลภาษา',
      sec_admin: 'การบริหาร',
      sec_admin_desc: 'เช็กชื่อ, ติดตามนักศึกษา, จัดตาราง, KPI Dashboard',
      // Features
      feat_title: 'เครื่องมือเด่น',
      feat_desc: 'พร้อมใช้งานทันที ไม่ต้องติดตั้ง',
      // Stats
      stat_tools: 'เครื่องมือ',
      stat_areas: 'ด้านหลัก',
      stat_cats: 'หมวดหมู่',
      stat_free: 'ฟรี',
      // Login modal
      login: 'เข้าสู่ระบบ',
      register: 'สมัครสมาชิก',
      email_label: 'อีเมล',
      password_label: 'รหัสผ่าน',
      confirmPwd: 'ยืนยันรหัสผ่าน',
      googleBtn: 'เข้าสู่ระบบด้วย Google',
      googleReg: 'สมัครด้วย Google',
      or: 'หรือ',
      submitLogin: 'เข้าสู่ระบบ',
      submitReg: 'สมัครสมาชิก',
      close: 'ปิด',
      footer: '© 2026 SPUBUS MAGIC — คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม',
    },
    en: {
      hero_pre: 'AI-Powered Platform',
      hero_title_1: 'AI Tools',
      hero_title_2: 'for Modern Educators',
      hero_desc: 'A comprehensive teaching support platform with 35 AI tools across 3 areas and 8 categories. Help educators work faster, easier, and more effectively.',
      org: 'School of Business, Sripatum University',
      cta: 'Sign In',
      cta_google: 'Sign in with Google',
      sec_teaching: 'Teaching',
      sec_teaching_desc: 'Smart Quiz, Live Quiz, Lesson Planner, Exit Ticket and more',
      sec_docs: 'Document Tools',
      sec_docs_desc: 'AI Letter Writer, Slide Maker, Plagiarism Checker, Translator',
      sec_admin: 'Administration',
      sec_admin_desc: 'Attendance, Student Progress, Schedule, KPI Dashboard',
      feat_title: 'Key Features',
      feat_desc: 'Ready to use — no installation needed',
      stat_tools: 'Tools',
      stat_areas: 'Areas',
      stat_cats: 'Categories',
      stat_free: 'Free',
      login: 'Sign In',
      register: 'Register',
      email_label: 'Email',
      password_label: 'Password',
      confirmPwd: 'Confirm Password',
      googleBtn: 'Sign in with Google',
      googleReg: 'Sign up with Google',
      or: 'or',
      submitLogin: 'Sign In',
      submitReg: 'Sign Up',
      close: 'Close',
      footer: '© 2026 SPUBUS MAGIC — School of Business, Sripatum University',
    },
  }[lang];

  // Auto-skip login screen — anyone hitting /teacher/login goes straight
  // to the dashboard. Login is OPTIONAL (only needed for cloud sync).
  // Users who want to sign in can use the user menu inside the dashboard.
  useEffect(() => {
    // Allow query ?force=1 to still show login form (e.g. for explicit sign-in)
    const force = searchParams.get('force');
    if (force) return;
    router.replace('/teacher');
  }, [router, searchParams]);

  useEffect(() => {
    if (!loading && user) router.push('/teacher');
  }, [user, loading, router]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) { setShowLogin(true); setMessage({ type: 'error', text: 'การเข้าสู่ระบบผิดพลาด กรุณาลองใหม่' }); }
  }, [searchParams]);

  if (loading) return <LoadingScreen />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบ' }); return; }
    if (tab === 'register' && password !== confirmPassword) { setMessage({ type: 'error', text: 'รหัสผ่านไม่ตรงกัน' }); return; }
    if (password.length < 6) { setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }); return; }
    setSubmitting(true); setMessage({ type: '', text: '' });
    try {
      if (tab === 'register') {
        await signUpWithEmail(email, password);
        setMessage({ type: 'success', text: 'สมัครสำเร็จ! กำลังเข้าสู่ระบบ...' });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) setMessage({ type: 'error', text: 'Email หรือรหัสผ่านไม่ถูกต้อง' });
      else if (msg.includes('Email not confirmed')) setMessage({ type: 'error', text: 'กรุณายืนยัน Email ก่อนเข้าสู่ระบบ' });
      else setMessage({ type: 'error', text: msg || 'เกิดข้อผิดพลาด' });
    } finally { setSubmitting(false); }
  };

  // Show full-page login directly (skip splash + marketing page)
  if (showLogin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b0b24 0%, #1a1a4e 40%, #2d1b69 100%)',
        fontFamily: "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif",
        padding: '20px',
      }}>
        <div style={{
          width: '480px', maxWidth: '92vw', padding: '44px', borderRadius: '24px',
          background: 'rgba(16,16,46,0.95)', border: `1px solid ${CI.cyan}15`,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 0 80px ${CI.cyan}10, 0 0 120px ${CI.magenta}08`,
        }}>
          {/* Logo + Brand */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/spu-bus-logo.png" alt="SPUBUS" style={{ height: '38px', marginBottom: '14px' }} />
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>
              <span style={{ color: '#fff' }}>SPUBUS </span>
              <span style={{ color: CI.magenta }}>SUPPORT</span>
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
          </div>

          {/* Tab */}
          <div style={{ display: 'flex', background: `${CI.cyan}08`, borderRadius: '12px', padding: '3px', marginBottom: '20px', border: `1px solid ${CI.cyan}10` }}>
            {[{ id: 'login', label: txt.login }, { id: 'register', label: txt.register }].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setMessage({ type: '', text: '' }); }} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? `linear-gradient(135deg, ${CI.cyan}18, ${CI.magenta}0a)` : 'none',
                color: tab === t.id ? CI.cyan : 'rgba(255,255,255,0.35)',
                fontWeight: tab === t.id ? 700 : 400, fontSize: '18px', fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={signInWithGoogle} style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer', fontWeight: 600, fontSize: '18px', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {tab === 'login' ? txt.googleBtn : txt.googleReg}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${CI.cyan}15, transparent)` }} />
            <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.2)' }}>{txt.or}</span>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${CI.magenta}15, transparent)` }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.email_label}</label>
              <input type="email" placeholder="example@gmail.com" value={email}
                onChange={e => setEmail(e.target.value)} disabled={submitting}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; }}
                onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; }}
              />
            </div>
            <div>
              <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.password_label}</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} disabled={submitting}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; }}
                onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; }}
              />
            </div>
            {tab === 'register' && (
              <div>
                <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.confirmPwd}</label>
                <input type="password" placeholder="••••••••" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} disabled={submitting}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; }}
                  onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; }}
                />
              </div>
            )}
            {message.text && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', fontSize: '16px',
                background: message.type === 'error' ? 'rgba(239,68,68,0.08)' : `${CI.cyan}10`,
                color: message.type === 'error' ? '#f87171' : CI.cyan,
                border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.2)' : `${CI.cyan}25`}`,
              }}>
                {message.text}
              </div>
            )}
            <button type="submit" disabled={submitting} style={{
              padding: '15px', borderRadius: '12px', border: 'none', marginTop: '6px',
              background: submitting ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '19px', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: submitting ? 'none' : `0 4px 20px ${CI.cyan}25`,
            }}>
              {submitting ? '...' : (tab === 'login' ? txt.submitLogin : txt.submitReg)}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { icon: '🎓', title: txt.sec_teaching, desc: txt.sec_teaching_desc, color: CI.cyan, tools: 10 },
    { icon: '📄', title: txt.sec_docs, desc: txt.sec_docs_desc, color: CI.magenta, tools: 15 },
    { icon: '⚙️', title: txt.sec_admin, desc: txt.sec_admin_desc, color: CI.gold, tools: 10 },
  ];

  const FEATURES = [
    { icon: '📝', label: 'Smart Quiz + QR', color: CI.cyan },
    { icon: '🎮', label: 'Live Quiz Game', color: CI.magenta },
    { icon: '📅', label: 'Attendance', color: CI.gold },
    { icon: '✉️', label: 'AI Letter Writer', color: CI.purple },
    { icon: '🔍', label: 'Plagiarism Check', color: CI.cyan },
    { icon: '🤖', label: 'AI Detector', color: CI.magenta },
    { icon: '📋', label: 'Lesson Planner', color: CI.gold },
    { icon: '🏆', label: 'Certificate', color: CI.purple },
    { icon: '🔗', label: 'URL Shortener', color: CI.cyan },
    { icon: '🔲', label: 'QR Generator', color: CI.magenta },
    { icon: '📊', label: 'Meeting Notes', color: CI.gold },
    { icon: '📏', label: 'Rubric Builder', color: CI.purple },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: CI.dark, color: '#fff', position: 'relative',
      fontFamily: "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
      {/* Glows */}
      <div style={{ position: 'fixed', top: '-200px', left: '-150px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${CI.cyan}18, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-250px', right: '-100px', width: '700px', height: '700px', borderRadius: '50%', background: `radial-gradient(circle, ${CI.magenta}10, transparent 65%)`, pointerEvents: 'none' }} />

      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '16px',
        background: 'rgba(11,11,36,0.9)', backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${CI.cyan}10`,
      }}>
        <img src="/spu-bus-logo.png" alt="SPUBUS" style={{ height: '36px', objectFit: 'contain' }} />
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1.5px' }}>
          <span style={{ color: '#fff' }}>SPUBUS</span>{' '}
          <span style={{ color: CI.magenta }}>SUPPORT</span>
        </span>
        <div style={{ flex: 1 }} />

        {/* Lang */}
        <div style={{ display: 'flex', background: `${CI.cyan}08`, borderRadius: '8px', padding: '2px', border: `1px solid ${CI.cyan}12` }}>
          {['th', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: lang === l ? `${CI.cyan}18` : 'none',
              color: lang === l ? CI.cyan : 'rgba(255,255,255,0.4)',
              fontWeight: lang === l ? 700 : 400, fontSize: '16px', fontFamily: 'inherit',
            }}>
              {l === 'th' ? '🇹🇭 ไทย' : '🇺🇸 EN'}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => setShowLogin(true)} style={{
          padding: '9px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
          color: '#fff', fontWeight: 700, fontSize: '18px', fontFamily: 'inherit',
          boxShadow: `0 2px 16px ${CI.cyan}30`,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {txt.cta} →
        </button>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingTop: '70px', position: 'relative' }}>
        <div style={{ maxWidth: '800px', padding: '40px' }}>
          {/* Pre-title badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '30px', marginBottom: '28px',
            background: `${CI.cyan}0c`, border: `1px solid ${CI.cyan}20`,
            fontSize: '18px', color: CI.cyan, fontWeight: 500,
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CI.cyan, boxShadow: `0 0 8px ${CI.cyan}60` }} />
            {txt.hero_pre}
          </div>

          {/* Main title */}
          <h1 style={{ fontSize: '76px', fontWeight: 900, lineHeight: 1.1, margin: '0 0 28px', letterSpacing: '-2px' }}>
            <span style={{ color: CI.cyan }}>35 </span>
            <span style={{ color: '#fff' }}>{txt.hero_title_1}</span>
            <br />
            <span style={{ background: `linear-gradient(135deg, ${CI.magenta}, #ff6b9d)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {txt.hero_title_2}
            </span>
          </h1>

          {/* Description */}
          <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, margin: '0 auto 18px', maxWidth: '700px' }}>
            {txt.hero_desc}
          </p>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.35)', marginBottom: '40px' }}>{txt.org}</p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowLogin(true)} style={{
              padding: '16px 40px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', fontWeight: 800, fontSize: '22px', fontFamily: 'inherit',
              boxShadow: `0 4px 28px ${CI.cyan}35, 0 4px 28px ${CI.magenta}15`,
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              {txt.cta} <span style={{ fontSize: '24px' }}>→</span>
            </button>
            <button onClick={signInWithGoogle} style={{
              padding: '16px 32px', borderRadius: '14px', border: `1px solid rgba(255,255,255,0.1)`,
              background: 'rgba(255,255,255,0.04)', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '20px', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '10px',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {txt.cta_google}
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: '50px', opacity: 0.3, animation: 'bounce 2s infinite' }}>
            <div style={{ fontSize: '28px' }}>↓</div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: '60px', padding: '50px 40px',
        background: `linear-gradient(180deg, transparent, ${CI.cyan}06)`,
        borderTop: `1px solid ${CI.cyan}08`, borderBottom: `1px solid ${CI.cyan}08`,
      }}>
        {[
          { num: '35', label: txt.stat_tools, color: CI.cyan },
          { num: '3', label: txt.stat_areas, color: CI.magenta },
          { num: '8', label: txt.stat_cats, color: CI.gold },
          { num: '100%', label: txt.stat_free, color: CI.purple },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '56px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ===== 3 SECTIONS ===== */}
      <section style={{ padding: '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {SECTIONS.map((sec, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredSection(i)}
              onMouseLeave={() => setHoveredSection(null)}
              style={{
                padding: '36px 28px', borderRadius: '20px', position: 'relative', overflow: 'hidden',
                background: hoveredSection === i ? `${sec.color}0c` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hoveredSection === i ? sec.color + '30' : 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.35s ease',
                transform: hoveredSection === i ? 'translateY(-6px)' : 'none',
                boxShadow: hoveredSection === i ? `0 12px 40px ${sec.color}15` : 'none',
              }}
            >
              {/* Glow */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: `radial-gradient(circle, ${sec.color}12, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ fontSize: '50px', marginBottom: '18px' }}>{sec.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: sec.color, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {sec.tools} tools
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px', color: '#fff' }}>{sec.title}</h3>
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>{sec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section style={{ padding: '40px 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '44px', fontWeight: 900, margin: '0 0 14px' }}>
            <span style={{ color: CI.cyan }}>{txt.feat_title}</span>
          </h2>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>{txt.feat_desc}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: '20px 16px', borderRadius: '14px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s',
              cursor: 'default',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${f.color}0c`; e.currentTarget.style.borderColor = `${f.color}30`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 12px',
                background: `${f.color}12`, border: `1px solid ${f.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
              }}>{f.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section style={{
        padding: '80px 40px', textAlign: 'center',
        background: `linear-gradient(180deg, transparent, ${CI.cyan}08)`,
        borderTop: `1px solid ${CI.cyan}08`,
      }}>
        <h2 style={{ fontSize: '42px', fontWeight: 900, margin: '0 0 18px' }}>
          {lang === 'th' ? 'พร้อมเริ่มต้นแล้วหรือยัง?' : 'Ready to Get Started?'}
        </h2>
        <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px' }}>
          {lang === 'th' ? 'เริ่มใช้งานเครื่องมือ AI ทั้ง 35 รายการได้ฟรี วันนี้' : 'Start using all 35 AI tools for free, today'}
        </p>
        <button onClick={() => setShowLogin(true)} style={{
          padding: '18px 52px', borderRadius: '14px', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
          color: '#fff', fontWeight: 800, fontSize: '22px', fontFamily: 'inherit',
          boxShadow: `0 4px 28px ${CI.cyan}35, 0 4px 28px ${CI.magenta}15`,
        }}>
          {txt.cta} →
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ padding: '28px 40px', textAlign: 'center', borderTop: `1px solid ${CI.cyan}08` }}>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{txt.footer}</p>
      </footer>

      {/* Footer accent line */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${CI.cyan}, ${CI.magenta}, ${CI.cyan})`, opacity: 0.5 }} />

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.25s ease',
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}>
          <div style={{
            width: '480px', maxWidth: '92vw', padding: '44px', borderRadius: '24px',
            background: 'rgba(16,16,46,0.95)', border: `1px solid ${CI.cyan}15`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 80px ${CI.cyan}10, 0 0 120px ${CI.magenta}08`,
            position: 'relative',
            animation: 'slideUp 0.3s ease',
          }}>
            {/* Close */}
            <button onClick={() => setShowLogin(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              width: '32px', height: '32px', borderRadius: '8px',
              border: 'none', background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>

            {/* Logo + Brand */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="/spu-bus-logo.png" alt="SPUBUS" style={{ height: '38px', marginBottom: '14px' }} />
              <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>
                <span style={{ color: '#fff' }}>SPUBUS </span>
                <span style={{ color: CI.magenta }}>SUPPORT</span>
              </h2>
            </div>

            {/* Tab */}
            <div style={{ display: 'flex', background: `${CI.cyan}08`, borderRadius: '12px', padding: '3px', marginBottom: '20px', border: `1px solid ${CI.cyan}10` }}>
              {[{ id: 'login', label: txt.login }, { id: 'register', label: txt.register }].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setMessage({ type: '', text: '' }); }} style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: tab === t.id ? `linear-gradient(135deg, ${CI.cyan}18, ${CI.magenta}0a)` : 'none',
                  color: tab === t.id ? CI.cyan : 'rgba(255,255,255,0.35)',
                  fontWeight: tab === t.id ? 700 : 400, fontSize: '18px', fontFamily: 'inherit',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Google */}
            <button onClick={signInWithGoogle} style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
              cursor: 'pointer', fontWeight: 600, fontSize: '18px', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              color: 'rgba(255,255,255,0.7)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {tab === 'login' ? txt.googleBtn : txt.googleReg}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${CI.cyan}15, transparent)` }} />
              <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.2)' }}>{txt.or}</span>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${CI.magenta}15, transparent)` }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.email_label}</label>
                <input type="email" placeholder="example@gmail.com" value={email}
                  onChange={e => setEmail(e.target.value)} disabled={submitting}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; e.target.style.boxShadow = `0 0 10px ${CI.cyan}12`; }}
                  onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.password_label}</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} disabled={submitting}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; e.target.style.boxShadow = `0 0 10px ${CI.cyan}12`; }}
                  onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              {tab === 'register' && (
                <div>
                  <label style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>{txt.confirmPwd}</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} disabled={submitting}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1px solid ${CI.cyan}15`, background: `${CI.cyan}06`, fontSize: '17px', outline: 'none', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = `${CI.cyan}50`; }}
                    onBlur={e => { e.target.style.borderColor = `${CI.cyan}15`; }}
                  />
                </div>
              )}

              {message.text && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px', fontSize: '16px',
                  background: message.type === 'error' ? 'rgba(239,68,68,0.08)' : `${CI.cyan}10`,
                  color: message.type === 'error' ? '#f87171' : CI.cyan,
                  border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.2)' : `${CI.cyan}25`}`,
                }}>
                  {message.text}
                </div>
              )}

              <button type="submit" disabled={submitting} style={{
                padding: '15px', borderRadius: '12px', border: 'none', marginTop: '6px',
                background: submitting ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '19px', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: submitting ? 'none' : `0 4px 20px ${CI.cyan}25`,
              }}>
                {submitting ? (
                  <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> กำลังดำเนินการ...</>
                ) : (
                  <>{tab === 'login' ? txt.submitLogin : txt.submitReg} →</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fonts & Styles */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        * { box-sizing: border-box; margin: 0; }
        html { scroll-behavior: smooth; }
        ::placeholder { color: rgba(255,255,255,0.18); }
        input:disabled { opacity: 0.5; }
        button { transition: transform 0.15s, filter 0.15s; }
        button:hover { filter: brightness(1.06); }
        button:active { transform: scale(0.98); }
        @media (max-width: 960px) {
          nav { padding: 12px 16px !important; }
        }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          section > div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
