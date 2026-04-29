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
    setFetchError(null);
    setClassData(null);
    fetchClass();
    pollRef.current = setInterval(fetchClass, 5000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode, view]);

  const [fetchError, setFetchError] = useState(null);
  const [autoRecovering, setAutoRecovering] = useState(false);
  const fetchClass = async () => {
    if (!activeCode) return;
    try {
      const res = await fetch(`/api/teacher/stampcard?code=${activeCode}`);
      const data = await res.json();
      if (res.ok) {
        setClassData(data);
        setFetchError(null);
        return;
      }
      // 404 — try silent auto-recovery if we have full local config
      const cached = savedClasses.find(c => c.code === activeCode);
      if (res.status === 404 && cached && cached.courseName && !autoRecovering) {
        setAutoRecovering(true);
        try {
          const r2 = await fetch('/api/teacher/stampcard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              course: cached.course, courseName: cached.courseName,
              section: cached.section || '1', teacher: cached.teacher || '',
              theme: cached.theme || 'space',
              totalSessions: cached.totalSessions || 15,
            }),
          });
          const newData = await r2.json();
          if (r2.ok) {
            // Replace old code with new, navigate seamlessly
            const updated = [
              { ...cached, code: newData.code, createdAt: Date.now() },
              ...savedClasses.filter(c => c.code !== activeCode),
            ];
            setSavedClasses(updated); saveCodes(updated);
            setActiveCode(newData.code);
            setClassData(newData.class);
            setFetchError(null);
            setAutoRecovering(false);
            return;
          }
        } catch {}
        setAutoRecovering(false);
      }
      setFetchError(data.error || 'ไม่พบห้องเรียน');
    } catch {
      setFetchError('เชื่อมต่อไม่ได้');
    }
  };

  // Remove a class from the local saved list (when room is gone from server)
  const removeFromLibrary = (code) => {
    if (!confirm(`ลบ ${code} ออกจากรายการเครื่องนี้?\n(ห้องในเซิร์ฟเวอร์ไม่ถูกลบ)`)) return;
    const updated = savedClasses.filter(c => c.code !== code);
    setSavedClasses(updated); saveCodes(updated);
    if (activeCode === code) {
      setActiveCode(''); setClassData(null); setView('list');
    }
  };

  // Recreate a class on the server using locally cached info
  // (used when the original code is lost from the server)
  const recreateMissingClass = async (oldCode) => {
    const cached = savedClasses.find(c => c.code === oldCode);
    if (!cached) {
      alert('ไม่มีข้อมูลห้องเดิมในเครื่อง — กรุณาสร้างใหม่');
      return;
    }
    if (!confirm(`สร้างห้องใหม่ด้วยข้อมูลเดิม:\n• ${cached.courseName}\n• ${cached.course} กลุ่ม ${cached.section || '1'}\n• ธีม ${cached.theme}\n\nรหัสเก่า ${oldCode} จะถูกลบ — รหัสใหม่จะถูกสร้างให้`)) return;

    try {
      const res = await fetch('/api/teacher/stampcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          course: cached.course,
          courseName: cached.courseName,
          section: cached.section || '1',
          teacher: cached.teacher || '',
          theme: cached.theme || 'space',
          totalSessions: cached.totalSessions || 15,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Remove old code from local list, add new one
      const updated = [
        { ...cached, code: data.code, createdAt: Date.now() },
        ...savedClasses.filter(c => c.code !== oldCode),
      ];
      setSavedClasses(updated); saveCodes(updated);
      setActiveCode(data.code);
      setClassData(data.class);
      setFetchError(null);
      alert(`✅ สร้างห้องใหม่สำเร็จ! รหัสใหม่: ${data.code}\n\nหมายเหตุ: นักศึกษาที่เคยเข้าห้องเก่า (${oldCode}) ต้องเข้ามาใหม่ด้วยรหัสนี้`);
    } catch (e) {
      alert(`สร้างไม่สำเร็จ: ${e.message}`);
    }
  };

  // Render student QR for active session
  useEffect(() => {
    if (!classData?.activeSession || !qrRef.current) return;
    const url = `${window.location.origin}/student/stamp?code=${activeCode}&qr=${classData.activeSession.qrToken}`;
    QRCode.toCanvas(qrRef.current, url, { width: 280, margin: 2 });
  }, [classData?.activeSession, activeCode]);

  // Render permanent class-join QR
  const classQrRef = useRef(null);
  useEffect(() => {
    if (!activeCode || !classQrRef.current) return;
    const url = `${window.location.origin}/student/stamp?code=${activeCode}`;
    QRCode.toCanvas(classQrRef.current, url, { width: 220, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
  }, [activeCode, view]);

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
      // Save FULL config so we can recreate later if server loses the class
      const updated = [{
        code: data.code,
        course: form.course, courseName: form.courseName,
        section: form.section, teacher: form.teacher,
        theme: form.theme, totalSessions: form.totalSessions,
        createdAt: Date.now(),
      }, ...savedClasses];
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
  // ── MANAGE: loading state ─────────────────────────────────────────────────
  if (view === 'manage' && !classData) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: '0 auto', fontFamily: FONT, textAlign: 'center' }}>
        <button onClick={() => { setView('list'); setActiveCode(''); setFetchError(null); }} style={{ marginBottom: 24, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontFamily: FONT }}>← กลับ</button>
        {fetchError ? (
          (() => {
            const cached = savedClasses.find(c => c.code === activeCode);
            const canRecreate = cached && cached.courseName;
            return (
              <div style={{
                background: '#fff', borderRadius: 16, padding: '36px 28px',
                border: '2px solid #fecaca',
                boxShadow: '0 4px 16px rgba(239,68,68,0.1)',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 56, marginBottom: 14, textAlign: 'center' }}>😕</div>
                <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 20, textAlign: 'center' }}>
                  ห้อง <span style={{ fontFamily:'monospace', color:'#dc2626' }}>{activeCode}</span> หายไปจากเซิร์ฟเวอร์
                </h2>
                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
                  เกิดจากเซิร์ฟเวอร์ขัดข้องชั่วคราวตอนสร้างห้อง · ข้อมูลในเครื่องคุณยังอยู่
                </p>

                {canRecreate && (
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:12, padding:'14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 6 }}>📋 ข้อมูลที่เก็บไว้:</div>
                    <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.7 }}>
                      <div><strong>วิชา:</strong> {cached.courseName} ({cached.course})</div>
                      <div><strong>กลุ่ม:</strong> {cached.section || '1'} · <strong>ครู:</strong> {cached.teacher || '—'}</div>
                      <div><strong>ธีม:</strong> {cached.theme} · <strong>คาบ:</strong> {cached.totalSessions || 15}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {canRecreate && (
                    <button onClick={() => recreateMissingClass(activeCode)} style={{
                      padding: '12px 22px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff',
                      cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 14,
                      boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
                    }}>✨ สร้างใหม่ด้วยข้อมูลเดิม</button>
                  )}
                  <button onClick={() => { setFetchError(null); fetchClass(); }} style={{
                    padding: '12px 20px', borderRadius: 10, border: 'none',
                    background: CI.cyan, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14,
                  }}>🔄 ลองใหม่</button>
                  <button onClick={() => removeFromLibrary(activeCode)} style={{
                    padding: '12px 20px', borderRadius: 10, border: '1px solid #fecaca',
                    background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14,
                  }}>🗑️ ลบออกจากรายการ</button>
                </div>

                <div style={{ marginTop: 16, padding: '10px 14px', background:'#fffbeb', borderRadius:8, fontSize: 12, color: '#92400e', textAlign: 'center' }}>
                  💡 <strong>"สร้างใหม่ด้วยข้อมูลเดิม"</strong> จะคงค่า course/theme/sessions ไว้ — แต่จะได้ <strong>รหัสใหม่</strong> เพราะรหัสเก่าใช้ไม่ได้แล้ว
                </div>
              </div>
            );
          })()
        ) : (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '60px 24px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 56, marginBottom: 14, animation: 'pulse 1.6s ease infinite' }}>🎫</div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.5;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }`}</style>
            <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 18 }}>กำลังเปิดห้อง <span style={{ fontFamily:'monospace', color: CI.cyan }}>{activeCode}</span>...</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>กรุณารอสักครู่</p>
          </div>
        )}
      </div>
    );
  }

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

        {/* ═══ STEP-BY-STEP GUIDE ═══ */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff, #fef3c7)',
          border: '1px solid #bae6fd', borderRadius: 16,
          padding: '14px 18px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', marginBottom: 8 }}>
            📖 วิธีให้นักศึกษาสแกนสะสมการ์ด
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            <div><strong style={{ color: CI.cyan }}>1️⃣ ครั้งแรก</strong> · นักศึกษาสแกน <strong>QR ห้องเรียน</strong> ด้านล่าง → กรอกรหัส+ชื่อ → เข้าห้อง</div>
            <div><strong style={{ color: CI.purple }}>2️⃣ ทุกคาบ</strong> · อาจารย์กด <strong>"เปิด Session"</strong> → QR ใหม่จะเด้งมา</div>
            <div><strong style={{ color: CI.magenta }}>3️⃣ เช็กชื่อ</strong> · นักศึกษาสแกน QR Session → รับตราอัตโนมัติ +10 ⭐</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* ═══ COLUMN 1: TWO QR CODES ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Class Join QR (always shown) */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: `2px solid ${CI.cyan}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ background: CI.cyan, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>STEP 1</span>
                <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>🎫 QR ห้องเรียน <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>(ครั้งแรก)</span></h3>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                แชร์ QR หรือ Code ให้นักศึกษาทุกคน — เข้าห้องครั้งเดียว ใช้ตลอดเทอม
              </p>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <canvas ref={classQrRef} style={{ borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>หรือบอก Code</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: CI.cyan, letterSpacing: 4, fontFamily: 'monospace' }}>{activeCode}</div>
                  <button onClick={() => {
                    const url = `${window.location.origin}/student/stamp?code=${activeCode}`;
                    navigator.clipboard.writeText(url);
                    toast.success('คัดลอกลิงก์แล้ว');
                  }} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#475569', fontFamily: FONT }}>
                    🔗 คัดลอกลิงก์
                  </button>
                </div>
              </div>
            </div>

            {/* Session Check-in QR */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, border: `2px solid ${isOpen ? '#22c55e' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: isOpen ? '#22c55e' : CI.purple, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>STEP 2-3</span>
                <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>📲 เช็กชื่อคาบเรียน</h3>
                {isOpen && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>🟢 LIVE</span>}
              </div>

              {!isOpen ? (
                <>
                  <label style={lbl}>เลือกคาบที่ <strong style={{ color: CI.cyan }}>{openSession}</strong> / {classData.totalSessions}</label>
                  <input type="number" min="1" max={classData.totalSessions} value={openSession}
                    onChange={e => setOpenSession(Math.max(1, Math.min(classData.totalSessions, Number(e.target.value) || 1)))}
                    style={{...inp, fontSize: 18, fontWeight: 800, textAlign: 'center'}} />
                  <button onClick={openSessionQR} style={{
                    marginTop: 10, width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                    cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15,
                    boxShadow: `0 6px 20px ${CI.cyan}40`,
                  }}>📲 เปิด QR เช็กชื่อ (15 นาที)</button>
                  <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                    💡 ตอนนี้ยังไม่เปิด Session — กดปุ่มเพื่อให้นักศึกษาเช็กชื่อ
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '6px 12px', marginBottom: 10, display: 'inline-block' }}>
                    <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Session {classData.activeSession.number} · เหลือ {minutesLeft} นาที</div>
                  </div>
                  <canvas ref={qrRef} style={{ maxWidth: '100%', borderRadius: 12, display: 'block', margin: '0 auto' }} />
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 8, fontWeight: 600 }}>
                    📱 ฉาย QR หน้าชั้น → นักศึกษาที่เคย join แล้วสแกน → รับตราเลย
                  </div>
                  <button onClick={closeSession} style={{
                    marginTop: 12, padding: '8px 18px', borderRadius: 8, border: '2px solid #fecaca',
                    background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 12,
                  }}>⏹️ ปิด Session ทันที</button>
                </div>
              )}
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
          <h2 style={{ margin: 0, fontSize: 26, color: '#0f172a', fontWeight: 900 }}>🃏 Class Pass+ <span style={{ fontSize: 18, color: '#64748b', fontWeight: 600 }}>· การ์ดสะสมคะแนนเข้าเรียน</span></h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>สแกนเข้าเรียน · สะสมตรา · ปลด badge — เปลี่ยนการเช็กชื่อให้นักศึกษาตื่นเต้นทุกคาบ</p>
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
              <div key={c.code} style={{
                position: 'relative',
                background: `linear-gradient(135deg, ${t.color}10, ${t.color}05)`,
                borderRadius: 14, padding: 18, border: `2px solid ${t.color}40`, transition: 'all 0.15s',
              }}>
                {/* Click area (excluding delete button) */}
                <div onClick={() => { setActiveCode(c.code); setView('manage'); }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.parentElement.style.transform = 'translateY(-3px)'; e.currentTarget.parentElement.style.boxShadow = `0 10px 24px ${t.color}30`; e.currentTarget.parentElement.style.borderColor = t.color; }}
                  onMouseLeave={e => { e.currentTarget.parentElement.style.transform = 'translateY(0)'; e.currentTarget.parentElement.style.boxShadow = 'none'; e.currentTarget.parentElement.style.borderColor = `${t.color}40`; }}>
                  <div style={{ display: 'inline-block', background: `${t.color}22`, color: t.color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>{c.code}</div>
                  <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: 16 }}>{c.courseName}</h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>{c.course} · {t.name}</div>
                  <div style={{ fontSize: 22, letterSpacing: 4 }}>{t.samples.slice(0,4).join(' ')}</div>
                  <div style={{
                    marginTop: 12, fontSize: 12, color: t.color, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    เปิดห้อง →
                  </div>
                </div>

                {/* Delete button — top-right corner */}
                <button onClick={e => { e.stopPropagation(); removeFromLibrary(c.code); }}
                  title="ลบออกจากรายการ"
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 8, width: 28, height: 28,
                    cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = ''; }}>
                  🗑️
                </button>
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
