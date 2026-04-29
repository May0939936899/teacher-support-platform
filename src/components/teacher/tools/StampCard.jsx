'use client';
/* StampCard — placeholder MVP. Full UI coming in next iteration.
   API at /api/teacher/stampcard is fully implemented. */
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";
const STORAGE = 'teacher_stampcards_v1';

const lbl = { fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 };
const inp = {
  width: '100%', padding: '10px 13px', borderRadius: 10, border: '2px solid #e2e8f0',
  fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#1e293b',
  boxSizing: 'border-box',
};

const THEME_PREVIEW = {
  space:   { name: 'Space Journey 🚀', color: '#7c4dff', samples: ['🚀','🌟','🌙','✨','🛸'] },
  anime:   { name: 'Anime Academy 🎌', color: '#e6007e', samples: ['🌸','🍙','🎎','⛩️','🎌'] },
  animals: { name: 'Cute Animals 🐾',   color: '#00b4e6', samples: ['🐶','🐱','🐰','🦊','🐼'] },
  food:    { name: 'Food Festival 🍕',  color: '#ffc107', samples: ['🍕','🍔','🌮','🍣','🍱'] },
};

function loadCodes() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
}
function saveCodes(arr) {
  try { localStorage.setItem(STORAGE, JSON.stringify(arr.slice(0, 50))); } catch {}
}

export default function StampCard() {
  const [view, setView] = useState('list'); // list | create | manage
  const [savedClasses, setSavedClasses] = useState([]);
  const [activeCode, setActiveCode] = useState('');
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    course: '', courseName: '', section: '1', teacher: '',
    totalSessions: 15, theme: 'space',
  });
  const [openSession, setOpenSession] = useState(1);
  const qrRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => { setSavedClasses(loadCodes()); }, []);

  useEffect(() => {
    if (!activeCode || view !== 'manage') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    fetchClass();
    pollRef.current = setInterval(fetchClass, 5000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode, view]);

  const fetchClass = async () => {
    try {
      const res = await fetch(`/api/teacher/stampcard?code=${activeCode}`);
      const data = await res.json();
      if (res.ok) setClassData(data);
    } catch {}
  };

  // Render student QR for active session
  useEffect(() => {
    if (!classData?.activeSession || !qrRef.current) return;
    const url = `${window.location.origin}/student/stamp?code=${activeCode}&qr=${classData.activeSession.qrToken}`;
    QRCode.toCanvas(qrRef.current, url, { width: 280, margin: 2 });
  }, [classData?.activeSession, activeCode]);

  const createClass = async () => {
    if (!form.course || !form.courseName) { toast.error('กรอกรหัสและชื่อวิชา'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/stampcard', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = [{ code: data.code, course: form.course, courseName: form.courseName, theme: form.theme, createdAt: Date.now() }, ...savedClasses];
      setSavedClasses(updated); saveCodes(updated);
      setActiveCode(data.code); setClassData(data.class); setView('manage');
      toast.success(`สร้าง ${data.code} แล้ว!`);
    } catch (e) {
      toast.error(e.message || 'สร้างไม่สำเร็จ');
    } finally { setLoading(false); }
  };

  const openSessionQR = async () => {
    const res = await fetch('/api/teacher/stampcard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'open_session', code: activeCode, sessionNumber: openSession, durationMinutes: 15 }),
    });
    const data = await res.json();
    if (res.ok) { toast.success(`เปิด Session ${openSession} แล้ว — QR ใช้ได้ 15 นาที`); fetchClass(); }
    else toast.error(data.error);
  };

  const closeSession = async () => {
    await fetch('/api/teacher/stampcard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close_session', code: activeCode }),
    });
    fetchClass();
  };

  // ════════════════════════════════════════════════════════════════════════
  // CREATE VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'create') {
    const t = THEME_PREVIEW[form.theme];
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: FONT }}>
        <button onClick={() => setView('list')} style={{ marginBottom: 14, padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontFamily: FONT }}>← กลับ</button>
        <div style={{ background: '#fff', borderRadius: 16, padding: 26, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 6px', color: '#0f172a' }}>🎴 สร้างการ์ดสะสมตรา</h2>
          <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 14 }}>เลือกธีม + จำนวนคาบ → นักศึกษาสแกน QR เพื่อสะสมตรา</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>รหัสวิชา *</label><input value={form.course} onChange={e => setForm({...form, course: e.target.value})} placeholder="MGT3367" style={inp} /></div>
            <div><label style={lbl}>ชื่อวิชา *</label><input value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} placeholder="การจัดการ" style={inp} /></div>
            <div><label style={lbl}>กลุ่ม</label><input value={form.section} onChange={e => setForm({...form, section: e.target.value})} placeholder="101" style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 18 }}>
            <div><label style={lbl}>ชื่ออาจารย์</label><input value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} placeholder="อ.สมชาย" style={inp} /></div>
            <div><label style={lbl}>จำนวนคาบ</label><input type="number" min="1" max="50" value={form.totalSessions} onChange={e => setForm({...form, totalSessions: Number(e.target.value) || 15})} style={{...inp, textAlign: 'center', fontWeight: 700}} /></div>
          </div>

          <label style={lbl}>🎨 เลือกธีมการ์ด</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 22 }}>
            {Object.entries(THEME_PREVIEW).map(([id, th]) => {
              const sel = form.theme === id;
              return (
                <div key={id} onClick={() => setForm({...form, theme: id})} style={{
                  background: sel ? `linear-gradient(135deg, ${th.color}22, ${th.color}11)` : '#f8fafc',
                  border: `2px solid ${sel ? th.color : '#e2e8f0'}`,
                  borderRadius: 14, padding: 14, cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: sel ? `0 4px 16px ${th.color}40` : 'none',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: sel ? th.color : '#1e293b', marginBottom: 8 }}>{th.name}</div>
                  <div style={{ fontSize: 22, letterSpacing: 4 }}>{th.samples.join('')}</div>
                </div>
              );
            })}
          </div>

          <button onClick={createClass} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: loading ? '#e2e8f0' : `linear-gradient(135deg, ${t.color}, ${CI.purple})`,
            color: loading ? '#94a3b8' : '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONT, fontWeight: 800, fontSize: 16,
            boxShadow: loading ? 'none' : `0 6px 20px ${t.color}40`,
          }}>
            {loading ? 'กำลังสร้าง...' : '🚀 สร้างการ์ดสะสม'}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // MANAGE VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'manage' && classData) {
    const isOpen = classData.activeSession && new Date(classData.activeSession.openUntil) > new Date();
    const minutesLeft = isOpen ? Math.ceil((new Date(classData.activeSession.openUntil) - new Date()) / 60000) : 0;

    return (
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={() => { setView('list'); setActiveCode(''); setClassData(null); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontFamily: FONT }}>← กลับ</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>CODE: {activeCode}</div>
            <h2 style={{ margin: '2px 0 0', color: '#0f172a', fontSize: 22 }}>{classData.courseName}</h2>
            <div style={{ fontSize: 13, color: '#64748b' }}>{classData.course} · กลุ่ม {classData.section} · {classData.themeName}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* QR Generator */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>📲 เปิด Session ใหม่</h3>
            {!isOpen ? (
              <>
                <label style={lbl}>เลือกคาบที่ {openSession} / {classData.totalSessions}</label>
                <input type="number" min="1" max={classData.totalSessions} value={openSession}
                  onChange={e => setOpenSession(Math.max(1, Math.min(classData.totalSessions, Number(e.target.value) || 1)))}
                  style={{...inp, fontSize: 18, fontWeight: 800, textAlign: 'center'}} />
                <button onClick={openSessionQR} style={{
                  marginTop: 12, width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                  cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 16,
                  boxShadow: `0 6px 20px ${CI.cyan}40`,
                }}>📲 เปิด QR (15 นาที)</button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#dcfce7', border: '2px solid #22c55e', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: '#166534', fontWeight: 700 }}>🟢 LIVE • Session {classData.activeSession.number} • เหลือ {minutesLeft} นาที</div>
                </div>
                <canvas ref={qrRef} style={{ maxWidth: '100%', borderRadius: 12 }} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>นักศึกษาสแกน QR นี้เพื่อรับตรา</div>
                <button onClick={closeSession} style={{
                  marginTop: 14, padding: '10px 20px', borderRadius: 10, border: '2px solid #e2e8f0',
                  background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: FONT, fontWeight: 700,
                }}>⏹️ ปิด Session</button>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: '#64748b', background: '#fef9c3', borderLeft: '3px solid #fbbf24', padding: '10px 12px', borderRadius: 6 }}>
              💡 แชร์ Code <strong style={{ color: CI.cyan }}>{activeCode}</strong> ให้นักศึกษาเข้าผ่าน /student/stamp
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>📊 สถิติห้อง</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <Stat label="นักศึกษา" value={(classData.students || []).length} icon="👥" color={CI.cyan} />
              <Stat label="Session ที่เปิด" value={(classData.sessions || []).length} icon="📅" color={CI.purple} />
              <Stat label="ตราที่แจกแล้ว" value={(classData.students || []).reduce((s, st) => s + Object.keys(st.stamps || {}).length, 0)} icon="🎴" color={CI.magenta} />
              <Stat label="คะแนนรวมห้อง" value={(classData.students || []).reduce((s, st) => s + (st.points || 0), 0)} icon="⭐" color={CI.gold} />
            </div>

            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0f172a' }}>🏆 Top นักศึกษา</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
              {[...(classData.students || [])]
                .sort((a, b) => Object.keys(b.stamps || {}).length - Object.keys(a.stamps || {}).length || (b.points || 0) - (a.points || 0))
                .slice(0, 10)
                .map((s, i) => {
                  const stampCount = Object.keys(s.stamps || {}).length;
                  return (
                    <div key={s.studentId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: i === 0 ? '#fef9c3' : '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 16, minWidth: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                      <span style={{ flex: 1, fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{s.firstName} {s.lastName}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>🎴 {stampCount}/{classData.totalSessions}</span>
                      <span style={{ fontSize: 12, color: CI.gold, fontWeight: 700 }}>⭐ {s.points || 0}</span>
                    </div>
                  );
                })}
              {(classData.students || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>ยังไม่มีนักศึกษา</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>🎴 การ์ดสะสมตรา</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>เปลี่ยนการเช็กชื่อให้สนุกแบบ gamified — เก็บตรา ปลด badge ได้รางวัล</p>
        </div>
        <button onClick={() => setView('create')} style={{
          padding: '12px 22px', borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15,
          boxShadow: `0 4px 16px ${CI.cyan}30`,
        }}>+ สร้างการ์ดใหม่</button>
      </div>

      {savedClasses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎴</div>
          <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>ยังไม่มีการ์ดสะสม</h3>
          <p style={{ margin: 0, color: '#64748b' }}>กด "+ สร้างการ์ดใหม่" เพื่อเริ่ม</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {savedClasses.map(c => {
            const t = THEME_PREVIEW[c.theme] || THEME_PREVIEW.space;
            return (
              <div key={c.code} onClick={() => { setActiveCode(c.code); setView('manage'); }} style={{
                background: `linear-gradient(135deg, ${t.color}10, ${t.color}05)`,
                borderRadius: 14, padding: 18, border: `2px solid ${t.color}40`, cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 24px ${t.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'inline-block', background: `${t.color}22`, color: t.color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{c.code}</div>
                <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 16 }}>{c.courseName}</h3>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{c.course} · {t.name}</div>
                <div style={{ fontSize: 22, letterSpacing: 4 }}>{t.samples.slice(0,4).join(' ')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, color }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}33`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{icon} {label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}
