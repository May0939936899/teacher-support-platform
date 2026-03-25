'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const CI = { cyan: '#00b4e6', dark: '#0b0b24' };
const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function ShortLinkRedirect() {
  const params = useParams();
  const code = params.code;
  const [status, setStatus] = useState('loading'); // loading | redirecting | notfound

  useEffect(() => {
    if (!code) { setStatus('notfound'); return; }

    // Check localStorage for the short link
    try {
      const saved = localStorage.getItem('teacher_short_links');
      if (saved) {
        const links = JSON.parse(saved);
        const link = links.find(l => l.code === code);
        if (link) {
          // Increment click count
          const updated = links.map(l =>
            l.code === code ? { ...l, clicks: (l.clicks || 0) + 1 } : l
          );
          localStorage.setItem('teacher_short_links', JSON.stringify(updated));

          setStatus('redirecting');
          window.location.href = link.originalUrl;
          return;
        }
      }
    } catch {}

    // Also try API (for shared links across devices)
    fetch(`/api/teacher/shortlink?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          setStatus('redirecting');
          window.location.href = data.url;
        } else {
          setStatus('notfound');
        }
      })
      .catch(() => setStatus('notfound'));
  }, [code]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: CI.dark, fontFamily: FONT, color: '#fff',
    }}>
      {status === 'loading' && (
        <>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)', borderTopColor: CI.cyan,
            animation: 'spin 0.8s linear infinite', marginBottom: '16px',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '16px', opacity: 0.7 }}>กำลังเปลี่ยนเส้นทาง...</p>
        </>
      )}
      {status === 'redirecting' && (
        <>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔗</div>
          <p style={{ fontSize: '16px', opacity: 0.7 }}>กำลังไปยังลิงก์ปลายทาง...</p>
        </>
      )}
      {status === 'notfound' && (
        <>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>ไม่พบลิงก์นี้</h2>
          <p style={{ fontSize: '16px', opacity: 0.6, margin: '0 0 24px' }}>
            ลิงก์ <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>/s/{code}</code> ไม่ถูกต้องหรือหมดอายุแล้ว
          </p>
          <a href="/" style={{
            padding: '10px 24px', borderRadius: '10px', background: CI.cyan,
            color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
          }}>
            ← กลับหน้าหลัก
          </a>
        </>
      )}
      <div style={{ position: 'absolute', bottom: '16px', fontSize: '12px', opacity: 0.3 }}>
        SPUBUS SUPPORT
      </div>
    </div>
  );
}
