'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentSplash from '@/components/StudentSplash';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'Kanit','Noto Sans Thai',-apple-system,sans-serif";

const inp = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: '2px solid #e2e8f0', fontSize: 16, fontFamily: FONT,
  outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s',
  background: '#fff', color: '#0f172a',
};

function StudentProgressInner() {
  const sp = useSearchParams();
  const codeParam = (sp.get('code') || '').toUpperCase();

  const [code,        setCode]        = useState(codeParam);
  const [studentId,   setStudentId]   = useState('');
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [classData,   setClassData]   = useState(null);
  const [error,       setError]       = useState('');
  const [joining,     setJoining]     = useState(false);
  const [joined,      setJoined]      = useState(false);

  // Auto-restore session from localStorage
  useEffect(() => {
    if (codeParam) {
      try {
        const saved = localStorage.getItem('gb_session_' + codeParam);
        if (saved) {
          const s = JSON.parse(saved);
          setStudentId(s.studentId || '');
          setFirstName(s.firstName || '');
          setLastName(s.lastName || '');
          if (s.studentId && s.firstName) {
            setJoined(true);
          }
        }
      } catch {}
    }
  }, [codeParam]);

  // Fetch / refresh class data
  const refresh = useCallback(async () => {
    if (!code || !studentId) return;
    try {
      const res = await fetch(`/api/teacher/gradebook?code=${code}&studentId=${studentId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setClassData(data);
    } catch {}
  }, [code, studentId]);

  useEffect(() => {
    if (joined) {
      refresh();
      const itv = setInterval(refresh, 8000);
      return () => clearInterval(itv);
    }
  }, [joined, refresh]);

  const handleJoin = async () => {
    if (!code || !studentId || !firstName) {
      setError('กรอกรหัสห้อง รหัสนักศึกษา และชื่อ');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/gradebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'student_join',
          code: code.toUpperCase(),
          studentId, firstName, lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เข้าห้องไม่ได้'); setJoining(false); return; }
      try {
        localStorage.setItem('gb_session_' + code.toUpperCase(),
          JSON.stringify({ studentId, firstName, lastName }));
      } catch {}
      setJoined(true);
    } catch (e) {
      setError('เชื่อมต่อไม่ได้');
    } finally {
      setJoining(false);
    }
  };

  const handleCheck = async (componentId, submitted) => {
    await fetch('/api/teacher/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'student_check',
        code: code.toUpperCase(),
        studentId, componentId, submitted,
      }),
    });
    refresh();
  };

  const logout = () => {
    try { localStorage.removeItem('gb_session_' + code.toUpperCase()); } catch {}
    setJoined(false);
    setClassData(null);
    setStudentId(''); setFirstName(''); setLastName('');
  };

  // ════════════════════════════════════════════════════════════════════════
  // JOIN SCREEN
  // ════════════════════════════════════════════════════════════════════════
  if (!joined) {
    return (
      <div style={{
        minHeight: '100dvh', background: 'linear-gradient(160deg,#eff6ff,#f0f9ff,#f5f3ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px', fontFamily: FONT,
      }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'slideUp 0.5s ease' }}>
          <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>📊</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0f172a' }}>
              ระบบบันทึกคะแนน
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
              เช็กคะแนนเก็บและส่งงานของคุณ
            </p>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20, padding: '24px 22px',
            boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
            border: '1px solid #e2e8f0',
          }}>
            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 700 }}>
              รหัสห้องเรียน
            </label>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="C12345"
              maxLength={10}
              style={{ ...inp, fontSize: 22, fontWeight: 900, textAlign: 'center', letterSpacing: 5, fontFamily: 'monospace', marginBottom: 14 }}
            />

            <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 700 }}>
              รหัสนักศึกษา *
            </label>
            <input
              value={studentId}
              onChange={e => { setStudentId(e.target.value); setError(''); }}
              placeholder="65000xxxxx"
              style={{ ...inp, marginBottom: 14, fontFamily: 'monospace', fontWeight: 700 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 700 }}>ชื่อ *</label>
                <input value={firstName} onChange={e => { setFirstName(e.target.value); setError(''); }} placeholder="สมชาย" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 6, fontWeight: 700 }}>นามสกุล</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="ใจดี" style={inp} />
              </div>
            </div>

            {error && (
              <div style={{
                color: '#dc2626', background: '#fee2e2', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, marginBottom: 12, fontWeight: 600,
              }}>⚠️ {error}</div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || !code || !studentId || !firstName}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: (!joining && code && studentId && firstName)
                  ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : '#e2e8f0',
                color: (!joining && code && studentId && firstName) ? '#fff' : '#94a3b8',
                cursor: (!joining && code && studentId && firstName) ? 'pointer' : 'not-allowed',
                fontFamily: FONT, fontSize: 16, fontWeight: 800, letterSpacing: 0.5,
                boxShadow: (!joining && code && studentId && firstName) ? `0 6px 20px ${CI.cyan}40` : 'none',
              }}>
              {joining ? 'กำลังเข้า...' : '🚀 เข้าระบบ'}
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 }}>
            ✨ ไม่ต้องสมัคร ไม่ต้องล็อกอิน — ใช้รหัสนักศึกษาเข้าระบบได้เลย
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DASHBOARD (after join)
  // ════════════════════════════════════════════════════════════════════════
  if (!classData) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: '#64748b' }}>
        กำลังโหลด...
      </div>
    );
  }

  const me = classData.me;
  if (!me) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: '#dc2626', padding: 20, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
          <h2>ไม่พบข้อมูลของคุณ</h2>
          <button onClick={logout} style={{ marginTop: 14, padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: FONT }}>← เปลี่ยนข้อมูล</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: FONT, padding: '16px 12px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Top header card */}
        <div style={{
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          borderRadius: 18, padding: '22px 22px 18px', color: '#fff',
          marginBottom: 16, position: 'relative',
          boxShadow: `0 10px 30px ${CI.purple}30`,
        }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{classData.course} · กลุ่ม {classData.section}</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900 }}>{classData.courseName}</h1>
          <div style={{ fontSize: 13, opacity: 0.8 }}>👨‍🏫 {classData.teacher}</div>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.85 }}>นักศึกษา</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{me.firstName} {me.lastName}</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>{me.studentId}</div>
            </div>
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '6px 14px', fontSize: 12, color: '#fff', cursor: 'pointer', fontFamily: FONT }}>ออก</button>
          </div>
        </div>

        {/* Big total score */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: '20px 22px',
          marginBottom: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>คะแนนรวมตอนนี้</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                {(me.earnedPct + me.bonusTotal).toFixed(1)}
                <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}> / {me.possiblePct}{me.bonusTotal > 0 && ` + ${me.bonusTotal} bonus`}</span>
              </div>
            </div>
            <div style={{
              fontSize: 36, fontWeight: 900,
              color: me.earnedPct + me.bonusTotal >= 50 ? '#16a34a' : '#dc2626',
            }}>
              {me.earnedPct + me.bonusTotal >= 80 ? '🏆' : me.earnedPct + me.bonusTotal >= 50 ? '👍' : '📚'}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, me.earnedPct + me.bonusTotal)}%`,
              background: `linear-gradient(90deg, ${CI.cyan}, ${CI.purple})`,
              transition: 'width 0.5s',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
            {me.possiblePct < 100 && `📌 บางวิชายังไม่ได้กรอกคะแนน — เต็มเมื่อจบเทอม 100%`}
          </div>
        </div>

        {/* Components list */}
        <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#0f172a' }}>📋 รายการคะแนนเก็บ</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {(classData.components || []).map(c => {
            const score = me.scores?.[c.id];
            const submitted = me.checklist?.[c.id]?.submitted;
            const checkAt = me.checklist?.[c.id]?.at;
            const pct = score != null ? (score / c.maxScore) * 100 : 0;
            const overdue = c.deadline && !submitted && new Date(c.deadline) < new Date();
            return (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 14, padding: 16,
                border: `2px solid ${score != null ? '#bbf7d0' : submitted ? '#bfdbfe' : overdue ? '#fecaca' : '#e2e8f0'}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {c.weight}% • เต็ม {c.maxScore} คะแนน
                      {c.deadline && (
                        <span style={{ marginLeft: 8, color: overdue ? '#dc2626' : '#64748b' }}>
                          ⏰ {new Date(c.deadline).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          {overdue && ' (เลยกำหนด)'}
                        </span>
                      )}
                    </div>
                  </div>
                  {score != null ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: pct >= 50 ? '#16a34a' : '#dc2626', lineHeight: 1 }}>
                        {score}<span style={{ fontSize: 12, color: '#94a3b8' }}>/{c.maxScore}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{pct.toFixed(0)}%</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>ยังไม่ตรวจ</div>
                  )}
                </div>

                {/* Checklist */}
                <div
                  onClick={() => handleCheck(c.id, !submitted)}
                  style={{
                    marginTop: 10, padding: '10px 12px', borderRadius: 10,
                    background: submitted ? '#dcfce7' : '#f8fafc',
                    border: `2px solid ${submitted ? '#22c55e' : '#e2e8f0'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: submitted ? '#22c55e' : '#fff',
                    border: `2px solid ${submitted ? '#22c55e' : '#cbd5e1'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 900,
                  }}>{submitted && '✓'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: submitted ? '#166534' : '#475569' }}>
                      {submitted ? '✅ ส่งแล้ว — ยืนยันด้วยตัวเอง' : '⏳ ยังไม่ได้กดยืนยันการส่ง'}
                    </div>
                    {submitted && checkAt && (
                      <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2 }}>
                        เมื่อ {new Date(checkAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bonus */}
        {(classData.bonus || []).length > 0 && (
          <>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#0f172a' }}>🎁 คะแนนพิเศษ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {classData.bonus.map(b => (
                <div key={b.id} style={{
                  background: '#fffbeb', borderRadius: 12, padding: '12px 16px',
                  border: '2px solid #fde68a',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#a16207' }}>เต็ม +{b.maxScore}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: me.bonus?.[b.id] ? '#92400e' : '#cbd5e1' }}>
                    +{me.bonus?.[b.id] ?? '0'}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Transparency note */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
          padding: '12px 14px', fontSize: 12, color: '#1e40af', lineHeight: 1.6,
        }}>
          🔍 <strong>ระบบโปร่งใส</strong> — ทุกการให้คะแนน + การกดยืนยันส่งงาน ถูกบันทึกประวัติทั้งหมด อาจารย์เห็นได้ตลอด
        </div>
      </div>
    </div>
  );
}

export default function StudentProgressPage() {
  const [showSplash, setShowSplash] = useState(true);
  return (
    <>
      {showSplash && <StudentSplash duration={2200} onFinish={() => setShowSplash(false)} />}
      <Suspense fallback={
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: '#64748b' }}>
          กำลังโหลด...
        </div>
      }>
        <StudentProgressInner />
      </Suspense>
    </>
  );
}
