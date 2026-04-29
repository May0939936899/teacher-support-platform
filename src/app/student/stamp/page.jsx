'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentSplash from '@/components/StudentSplash';

const FONT = "'Kanit','Noto Sans Thai',-apple-system,sans-serif";

// ── Theme palettes (matches API) ─────────────────────────────────────────────
const THEMES = {
  space:   { name:'Space Journey 🚀',   accent:'#7c4dff', bg1:'#1e1b4b', bg2:'#312e81', bg3:'#0f172a', text:'#fff', overlay:'rgba(255,255,255,0.06)' },
  anime:   { name:'Anime Academy 🎌',   accent:'#ec4899', bg1:'#fdf2f8', bg2:'#fce7f3', bg3:'#fbcfe8', text:'#831843', overlay:'rgba(236,72,153,0.08)' },
  animals: { name:'Cute Animals 🐾',    accent:'#10b981', bg1:'#ecfdf5', bg2:'#d1fae5', bg3:'#a7f3d0', text:'#064e3b', overlay:'rgba(16,185,129,0.08)' },
  food:    { name:'Food Festival 🍕',   accent:'#f59e0b', bg1:'#fffbeb', bg2:'#fef3c7', bg3:'#fde68a', text:'#78350f', overlay:'rgba(245,158,11,0.08)' },
};

const STORAGE_KEY = (code) => 'sc_session_' + code;

// ────────────────────────────────────────────────────────────────────────────
function StudentStampInner() {
  const sp = useSearchParams();
  const codeParam = (sp.get('code') || '').toUpperCase();
  const qrToken   = sp.get('qr') || '';

  const [code,        setCode]        = useState(codeParam);
  const [studentId,   setStudentId]   = useState('');
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [classData,   setClassData]   = useState(null);
  const [error,       setError]       = useState('');
  const [joining,     setJoining]     = useState(false);
  const [joined,      setJoined]      = useState(false);

  // Check-in animation states
  const [showStamp, setShowStamp] = useState(null); // {stamp, session, points, golden}
  const [pendingScan, setPendingScan] = useState(qrToken); // QR token waiting to redeem after join

  // ── Restore session ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!codeParam) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(codeParam));
      if (saved) {
        const s = JSON.parse(saved);
        setStudentId(s.studentId || '');
        setFirstName(s.firstName || '');
        setLastName(s.lastName || '');
        if (s.studentId && s.firstName) setJoined(true);
      }
    } catch {}
  }, [codeParam]);

  // ── Fetch class data ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!code || !studentId) return;
    try {
      const res = await fetch(`/api/teacher/stampcard?code=${code}&studentId=${studentId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setClassData(data);
    } catch {}
  }, [code, studentId]);

  useEffect(() => {
    if (!joined) return;
    refresh();
    const itv = setInterval(refresh, 5000);
    return () => clearInterval(itv);
  }, [joined, refresh]);

  // ── Auto-redeem pending QR after join ─────────────────────────────────────
  useEffect(() => {
    if (joined && pendingScan && classData?.activeSession) {
      doCheckIn(pendingScan);
      setPendingScan('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, classData]);

  // ── Sounds (Web Audio) ────────────────────────────────────────────────────
  const playSound = (type) => {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const tone = (f, s, d, w='sine', v=0.18) => {
        const o = ac.createOscillator(); const g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.type = w; o.frequency.setValueAtTime(f, ac.currentTime + s);
        g.gain.setValueAtTime(v, ac.currentTime + s);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + s + d);
        o.start(ac.currentTime + s); o.stop(ac.currentTime + s + d + 0.01);
      };
      if (type === 'stamp') {
        [659, 784, 988, 1175].forEach((f, i) => tone(f, i * 0.08, 0.18, 'triangle', 0.22));
      } else if (type === 'golden') {
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.13, 0.3, 'triangle', 0.25));
      } else if (type === 'error') {
        tone(220, 0, 0.3, 'sawtooth', 0.15);
      }
      setTimeout(() => { try { ac.close(); } catch {} }, 2500);
    } catch {}
  };

  const handleJoin = async () => {
    if (!code || !studentId || !firstName) { setError('กรอกข้อมูลให้ครบ'); return; }
    setJoining(true); setError('');
    try {
      const res = await fetch('/api/teacher/stampcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'student_join', code: code.toUpperCase(), studentId, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เข้าห้องไม่ได้'); setJoining(false); return; }
      try { localStorage.setItem(STORAGE_KEY(code.toUpperCase()), JSON.stringify({ studentId, firstName, lastName })); } catch {}
      setJoined(true);
    } catch {
      setError('เชื่อมต่อไม่ได้');
    } finally {
      setJoining(false);
    }
  };

  const doCheckIn = async (token) => {
    try {
      const res = await fetch('/api/teacher/stampcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_in', code: code.toUpperCase(), qrToken: token, studentId }),
      });
      const data = await res.json();
      if (data.alreadyChecked) {
        setShowStamp({ alreadyChecked: true, stamp: data.stamp, session: data.session });
        playSound('error');
        return;
      }
      if (!res.ok) {
        setShowStamp({ error: data.error || 'เช็กชื่อไม่ได้' });
        playSound('error');
        return;
      }
      setShowStamp({
        stamp: data.stamp, session: data.session,
        points: data.points, golden: data.golden,
      });
      playSound(data.golden ? 'golden' : 'stamp');
      // Vibrate
      if (navigator.vibrate) navigator.vibrate(data.golden ? [50, 50, 100, 50, 200] : [50, 30, 80]);
      refresh();
    } catch {
      setShowStamp({ error: 'เชื่อมต่อไม่ได้' });
    }
  };

  const tryScanCurrent = () => {
    if (!classData?.activeSession) {
      setShowStamp({ error: 'หมดเวลาเช็กชื่อแล้ว ⏰\nกรุณาติดต่ออาจารย์ผู้สอน' });
      playSound('error');
      return;
    }
    if (new Date(classData.activeSession.openUntil) < new Date()) {
      setShowStamp({ error: 'หมดเวลาเช็กชื่อแล้ว ⏰\nกรุณาติดต่ออาจารย์ผู้สอน' });
      playSound('error');
      return;
    }
    doCheckIn(classData.activeSession.qrToken);
  };

  const logout = () => {
    try { localStorage.removeItem(STORAGE_KEY(code.toUpperCase())); } catch {}
    setJoined(false); setClassData(null);
    setStudentId(''); setFirstName(''); setLastName('');
  };

  // ════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN — clean, friendly, no-login welcome
  // ════════════════════════════════════════════════════════════════════════
  if (!joined) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg,#fef3c7 0%,#fde68a 35%,#fbbf24 100%)',
        fontFamily: FONT, padding: '24px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{`
          @keyframes spIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        `}</style>
        <div style={{ width: '100%', maxWidth: 420, animation: 'spIn 0.5s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 72, animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>🎫</div>
            <h1 style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 900, color: '#451a03' }}>
              Class Pass+
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#92400e', fontWeight: 600 }}>
              ยินดีต้อนรับกลับ 👋
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a16207' }}>
              สแกนเข้าเรียน · สะสมตรา · ปลดล็อก rewards
            </p>
          </div>

          <div style={{
            background: '#fff', borderRadius: 24, padding: '28px 22px',
            boxShadow: '0 16px 48px rgba(120,53,15,0.18)',
            border: '1px solid rgba(255,255,255,0.8)',
          }}>
            <Field label="🎫 รหัสห้อง" value={code} onChange={v => { setCode(v.toUpperCase()); setError(''); }}
              placeholder="S12345" maxLength={10} mono big upper />
            <Field label="🆔 รหัสนักศึกษา" value={studentId} onChange={v => { setStudentId(v); setError(''); }}
              placeholder="65000xxxxx" mono />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="ชื่อ" value={firstName} onChange={v => { setFirstName(v); setError(''); }} placeholder="สมชาย" />
              <Field label="นามสกุล" value={lastName} onChange={v => setLastName(v)} placeholder="ใจดี" />
            </div>

            {error && (
              <div style={{ background:'#fee2e2', color:'#991b1b', borderRadius:10, padding:'10px 14px', marginTop:10, fontSize:13, fontWeight:600 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleJoin} disabled={joining || !code || !studentId || !firstName}
              style={{
                marginTop: 18, width: '100%', padding: '15px',
                borderRadius: 14, border: 'none',
                background: (joining || !code || !studentId || !firstName)
                  ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#dc2626)',
                color: (joining || !code || !studentId || !firstName) ? '#9ca3af' : '#fff',
                cursor: (joining || !code || !studentId || !firstName) ? 'not-allowed' : 'pointer',
                fontSize: 17, fontWeight: 900, fontFamily: FONT, letterSpacing: 0.5,
                boxShadow: (joining || !code || !studentId || !firstName)
                  ? 'none' : '0 8px 24px rgba(245,158,11,0.4)',
              }}>
              {joining ? '⏳ กำลังเข้า...' : '🎫 เริ่มสะสมตรา'}
            </button>
          </div>

          <p style={{ textAlign:'center', color:'rgba(120,53,15,0.7)', fontSize:12, marginTop:14, fontWeight:500 }}>
            ✨ ไม่ต้องสมัคร — แค่ใส่รหัสนักศึกษา
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════════
  if (!classData) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, color:'#64748b' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:42, marginBottom:8, animation:'float 2s ease infinite' }}>🎫</div>
          กำลังโหลดการ์ด...
        </div>
      </div>
    );
  }

  const me = classData.me;
  if (!me) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, padding:20 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:14 }}>😕</div>
          <h2 style={{ color:'#0f172a' }}>ไม่พบข้อมูลของคุณ</h2>
          <p style={{ color:'#64748b' }}>กรุณาเข้าใหม่</p>
          <button onClick={logout} style={{ marginTop:12, padding:'10px 20px', borderRadius:10, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontFamily:FONT }}>← เปลี่ยนข้อมูล</button>
        </div>
      </div>
    );
  }

  const T = THEMES[classData.theme] || THEMES.space;
  const stampCount = me.stampCount || 0;
  const totalSessions = classData.totalSessions || 15;
  const progress = (stampCount / totalSessions) * 100;
  const isLight = classData.theme !== 'space'; // space is dark theme; others are light

  return (
    <div style={{
      minHeight:'100dvh',
      background: isLight
        ? `linear-gradient(160deg,${T.bg1} 0%,${T.bg2} 50%,${T.bg3} 100%)`
        : `linear-gradient(160deg,${T.bg1} 0%,${T.bg2} 50%,${T.bg3} 100%)`,
      fontFamily: FONT, color: T.text, padding:'12px 12px 100px',
    }}>
      <style>{`
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes glowPulse{ 0%,100%{box-shadow:0 0 20px ${T.accent}55,0 4px 16px rgba(0,0,0,0.1)} 50%{box-shadow:0 0 32px ${T.accent}99,0 4px 16px rgba(0,0,0,0.15)} }
        @keyframes stampPop { 0%{transform:scale(0) rotate(-180deg);opacity:0} 60%{transform:scale(1.2) rotate(10deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes ripple   { 0%{transform:scale(0.95);box-shadow:0 0 0 0 ${T.accent}66} 70%{box-shadow:0 0 0 14px ${T.accent}00} 100%{transform:scale(0.95);box-shadow:0 0 0 0 ${T.accent}00} }
      `}</style>

      <div style={{ maxWidth: 460, margin:'0 auto' }}>

        {/* ════════════ HERO CARD (LINE-style) ════════════ */}
        <div style={{
          position:'relative',
          background: isLight
            ? `linear-gradient(135deg,${T.accent},${T.accent}cc)`
            : `linear-gradient(135deg,${T.accent},#1e1b4b)`,
          borderRadius:24, padding:'22px 22px 18px',
          boxShadow:`0 16px 40px ${T.accent}40`,
          color:'#fff', overflow:'hidden',
        }}>
          {/* Decorative shimmer overlay */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s linear infinite',
          }} />

          {/* Top bar — class info */}
          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, opacity:0.85, fontWeight:600, letterSpacing:1, textTransform:'uppercase' }}>
                CLASS PASS+
              </div>
              <div style={{ fontSize:18, fontWeight:900, marginTop:2 }}>{classData.courseName}</div>
              <div style={{ fontSize:12, opacity:0.85, marginTop:2 }}>{classData.course} · กลุ่ม {classData.section}</div>
            </div>
            <button onClick={logout} style={{
              background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)',
              borderRadius:10, padding:'4px 10px', fontSize:11, color:'#fff',
              cursor:'pointer', fontFamily:FONT,
            }}>ออก</button>
          </div>

          {/* Student name */}
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{
              width:42, height:42, borderRadius:'50%',
              background:'rgba(255,255,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, fontWeight:900,
              border:'2px solid rgba(255,255,255,0.4)',
            }}>{me.firstName.charAt(0)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800 }}>{me.firstName} {me.lastName}</div>
              <div style={{ fontSize:11, opacity:0.8, fontFamily:'monospace' }}>{me.studentId}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:11, opacity:0.85 }}>POINTS</div>
              <div style={{ fontSize:24, fontWeight:900, lineHeight:1 }}>⭐{me.points || 0}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700 }}>📍 ความคืบหน้า</span>
              <span style={{ fontSize:13, fontWeight:900 }}>{stampCount} / {totalSessions}</span>
            </div>
            <div style={{ height:10, borderRadius:5, background:'rgba(0,0,0,0.2)', overflow:'hidden' }}>
              <div style={{
                height:'100%', width:`${progress}%`,
                background:'linear-gradient(90deg,#fff,#fef3c7)',
                borderRadius:5, transition:'width 0.6s',
                boxShadow:'0 0 12px rgba(255,255,255,0.6)',
              }} />
            </div>
            {me.golden && (
              <div style={{
                marginTop:10, background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color:'#78350f', borderRadius:10, padding:'8px 12px',
                textAlign:'center', fontWeight:900, fontSize:13,
                animation:'glowPulse 2s ease infinite',
              }}>
                🏆 GOLDEN CARD UNLOCKED!
              </div>
            )}
          </div>
        </div>

        {/* ════════════ STAMP GRID ════════════ */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12, padding:'0 4px' }}>
            <h2 style={{ margin:0, fontSize:17, fontWeight:900, color:isLight ? T.text : '#fff' }}>
              🎴 ตราสะสมของคุณ
            </h2>
            <div style={{ fontSize:12, color: isLight ? T.text : 'rgba(255,255,255,0.6)', opacity:0.7 }}>
              {classData.themeName}
            </div>
          </div>

          <div style={{
            background: isLight ? '#fff' : T.overlay,
            borderRadius:20, padding:16,
            border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
          }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(5, 1fr)',
              gap:10,
            }}>
              {Array.from({length: totalSessions}).map((_, i) => {
                const sessionNum = i + 1;
                const stamp = me.stamps?.[sessionNum];
                const isOwned = !!stamp;
                return (
                  <div key={i} style={{
                    aspectRatio:'1/1',
                    borderRadius:14,
                    background: isOwned
                      ? `linear-gradient(135deg, ${T.accent}25, ${T.accent}10)`
                      : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                    border: isOwned
                      ? `2px solid ${T.accent}`
                      : `2px dashed ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexDirection:'column',
                    position:'relative',
                    boxShadow: isOwned ? `0 4px 12px ${T.accent}33` : 'none',
                    transition:'all 0.3s',
                    animation: isOwned ? 'stampPop 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                  }}>
                    <div style={{
                      position:'absolute', top:4, left:6,
                      fontSize:9, fontWeight:800,
                      color: isOwned ? T.accent : (isLight ? '#94a3b8' : 'rgba(255,255,255,0.4)'),
                    }}>{sessionNum}</div>

                    {isOwned ? (
                      <>
                        <div style={{
                          fontSize:30,
                          filter: `drop-shadow(0 2px 6px ${T.accent}55)`,
                        }}>{stamp.stamp}</div>
                        {stamp.early && (
                          <div style={{
                            position:'absolute', top:2, right:2,
                            fontSize:9, background:'#fbbf24', color:'#78350f',
                            borderRadius:4, padding:'1px 4px', fontWeight:800,
                          }}>+5</div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize:18, opacity:0.3 }}>🔒</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════════ BADGES ════════════ */}
        {me.badges && me.badges.length > 0 && (
          <div style={{ marginTop:20 }}>
            <h2 style={{ margin:'0 0 12px', fontSize:17, fontWeight:900, color: isLight ? T.text : '#fff', padding:'0 4px' }}>
              🏆 Achievements
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {me.badges.map(b => {
                return (
                  <div key={b.id} style={{
                    background: isLight ? '#fff' : T.overlay,
                    borderRadius:14, padding:'12px 14px',
                    border: b.unlocked
                      ? `2px solid ${T.accent}`
                      : isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', gap:12,
                    opacity: b.unlocked ? 1 : 0.6,
                    boxShadow: b.unlocked ? `0 4px 16px ${T.accent}30` : 'none',
                  }}>
                    <div style={{
                      width:40, height:40, borderRadius:'50%',
                      background: b.unlocked
                        ? `linear-gradient(135deg, ${T.accent}, ${T.accent}aa)`
                        : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)'),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20, flexShrink:0,
                      filter: b.unlocked ? 'none' : 'grayscale(1)',
                    }}>{b.unlocked ? '🏆' : '🔒'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:800, color: isLight ? T.text : '#fff' }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize:11, color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)' }}>
                        {b.desc}
                      </div>
                      {!b.unlocked && (
                        <div style={{ marginTop:4, height:4, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{
                            height:'100%', width:`${(b.progress/b.target)*100}%`,
                            background: T.accent, borderRadius:2,
                          }} />
                        </div>
                      )}
                    </div>
                    {b.unlocked
                      ? <div style={{ fontSize:11, fontWeight:800, color:T.accent }}>✓</div>
                      : <div style={{ fontSize:11, color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.5)', fontWeight:700 }}>{b.progress}/{b.target}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════ HOW-TO note ════════════ */}
        <div style={{
          marginTop:24, padding:'14px 16px',
          background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.05)',
          border: isLight ? '1px dashed rgba(0,0,0,0.1)' : '1px dashed rgba(255,255,255,0.15)',
          borderRadius:14, fontSize:12,
          color: isLight ? T.text : 'rgba(255,255,255,0.8)',
          opacity: 0.85, lineHeight:1.6,
        }}>
          💡 <strong>วิธีรับตรา:</strong> เมื่ออาจารย์เปิด Session กดปุ่ม <strong>"เช็กชื่อตอนนี้"</strong> ด้านล่าง — ถ้ามาก่อน 9 โมง รับ +5 bonus!
        </div>
      </div>

      {/* ════════════ FLOATING CHECK-IN BUTTON ════════════ */}
      <div style={{
        position:'fixed', bottom:20, left:0, right:0,
        display:'flex', justifyContent:'center', zIndex:50, padding:'0 16px',
        pointerEvents:'none',
      }}>
        <button
          onClick={tryScanCurrent}
          style={{
            pointerEvents:'auto',
            padding:'16px 36px', borderRadius:50, border:'none',
            background: classData.activeSession
              ? `linear-gradient(135deg,${T.accent},${T.accent}dd)`
              : 'rgba(0,0,0,0.4)',
            color:'#fff', fontSize:16, fontWeight:900, fontFamily:FONT,
            cursor:'pointer', letterSpacing:0.5,
            boxShadow: classData.activeSession
              ? `0 12px 32px ${T.accent}80, 0 0 0 4px rgba(255,255,255,0.5)`
              : '0 8px 24px rgba(0,0,0,0.25)',
            display:'flex', alignItems:'center', gap:10,
            animation: classData.activeSession ? 'ripple 1.6s ease infinite' : 'none',
            backdropFilter:'blur(8px)',
          }}>
          {classData.activeSession
            ? <>🎫 เช็กชื่อตอนนี้ — Session {classData.activeSession.number}</>
            : <>⏰ ยังไม่เปิด Session</>}
        </button>
      </div>

      {/* ════════════ STAMP RECEIVED MODAL ════════════ */}
      {showStamp && (
        <div onClick={() => setShowStamp(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
          backdropFilter:'blur(8px)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          animation: 'fadeIn 0.3s ease',
        }}>
          <style>{`@keyframes fadeIn {from{opacity:0}to{opacity:1}}`}</style>
          <div onClick={e => e.stopPropagation()} style={{
            background: showStamp.error ? '#fff' : `linear-gradient(135deg,${T.accent},${T.accent}cc)`,
            color: showStamp.error ? '#0f172a' : '#fff',
            borderRadius:24, padding:'36px 28px',
            textAlign:'center', maxWidth:340, width:'100%',
            boxShadow:'0 30px 80px rgba(0,0,0,0.5)',
            border: showStamp.error ? '3px solid #ef4444' : `3px solid rgba(255,255,255,0.3)`,
          }}>
            {showStamp.error ? (
              <>
                <div style={{ fontSize:60, marginBottom:14 }}>⚠️</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#dc2626', whiteSpace:'pre-line' }}>{showStamp.error}</div>
              </>
            ) : showStamp.alreadyChecked ? (
              <>
                <div style={{ fontSize:60, marginBottom:14 }}>😉</div>
                <div style={{ fontSize:18, fontWeight:900, marginBottom:8 }}>วันนี้คุณเช็กชื่อแล้วนะ</div>
                <div style={{ fontSize:60, margin:'12px 0', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{showStamp.stamp}</div>
                <div style={{ fontSize:12, opacity:0.85 }}>Session {showStamp.session}</div>
              </>
            ) : showStamp.golden ? (
              <>
                <div style={{ fontSize:80, marginBottom:14 }}>🏆</div>
                <div style={{ fontSize:22, fontWeight:900, marginBottom:6 }}>Golden Card Unlocked!</div>
                <div style={{ fontSize:14, opacity:0.9, marginBottom:18 }}>
                  คุณสะสมครบ {totalSessions} ครั้งแล้ว ✨<br/>เก่งมากเลย!
                </div>
                <div style={{ fontSize:80, margin:'12px 0', animation:'stampPop 0.8s ease' }}>{showStamp.stamp}</div>
                <div style={{ fontSize:14, fontWeight:800 }}>+{showStamp.points} points</div>
              </>
            ) : (
              <>
                <div style={{ fontSize:18, fontWeight:800, opacity:0.9 }}>เช็กชื่อสำเร็จ 🎉</div>
                <div style={{ fontSize:14, opacity:0.85, marginTop:4 }}>คุณได้รับตราใหม่แล้ว!</div>
                <div style={{
                  fontSize:96, margin:'18px 0',
                  animation:'stampPop 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                  filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                }}>{showStamp.stamp}</div>
                <div style={{ fontSize:13, opacity:0.85 }}>
                  Session {showStamp.session}/{totalSessions}
                </div>
                <div style={{
                  marginTop:14, display:'inline-block',
                  background:'rgba(255,255,255,0.25)', borderRadius:20,
                  padding:'8px 20px', fontSize:16, fontWeight:900,
                }}>
                  ⭐ +{showStamp.points} points
                </div>
              </>
            )}
            <button onClick={() => setShowStamp(null)} style={{
              marginTop:22, padding:'12px 32px', borderRadius:50, border:'none',
              background: showStamp.error ? '#ef4444' : 'rgba(255,255,255,0.25)',
              color:'#fff', fontSize:15, fontWeight:800,
              cursor:'pointer', fontFamily:FONT,
              border: showStamp.error ? 'none' : '2px solid rgba(255,255,255,0.4)',
            }}>
              {showStamp.error ? 'ปิด' : 'เยี่ยม! ✨'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Field component
function Field({ label, value, onChange, placeholder, mono, big, upper, maxLength }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:5, fontWeight:700 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(upper ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width:'100%', padding:'12px 14px', borderRadius:12,
          border:'2px solid #e5e7eb', fontSize: big ? 22 : 15,
          fontWeight: big ? 900 : 600,
          fontFamily: mono ? "'Courier New',monospace" : FONT,
          textAlign: big ? 'center' : 'left',
          letterSpacing: big ? 5 : 0,
          color:'#0f172a', outline:'none', boxSizing:'border-box',
          transition:'border-color 0.15s', background:'#fff',
        }}
        onFocus={e => e.target.style.borderColor = '#f59e0b'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );
}

export default function StudentStampPage() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <StudentSplash duration={2200} onFinish={() => setShowSplash(false)} />}
      <Suspense fallback={
        <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT, color:'#64748b' }}>
          กำลังโหลด...
        </div>
      }>
        <StudentStampInner />
      </Suspense>
    </>
  );
}
