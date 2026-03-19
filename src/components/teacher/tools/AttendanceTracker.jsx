'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, {
      width: 200,
      margin: 2,
      color: { dark: '#ef4444', light: '#ffffff' },
    });
  });
}

function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 12);
    localStorage.setItem('device_id', id);
  }
  return id;
}

export default function AttendanceTracker() {
  const [mode, setMode] = useState('teacher'); // teacher | student
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newSession, setNewSession] = useState({ courseName: '', section: '', topic: '', durationMin: 90 });
  const [studentView, setStudentView] = useState({ code: '', name: '', studentId: '', step: 'join' });
  const qrRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('teacher_attendance_sessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const attCode = params.get('att');
      if (attCode) {
        setMode('student');
        setStudentView(v => ({ ...v, code: attCode }));
      }
    }
  }, []);

  const saveSessions = (s) => {
    setSessions(s);
    localStorage.setItem('teacher_attendance_sessions', JSON.stringify(s));
  };

  const createSession = () => {
    if (!newSession.courseName) { toast.error('กรุณากรอกชื่อวิชา'); return; }
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const session = {
      id: code,
      ...newSession,
      createdAt: Date.now(),
      expiresAt: Date.now() + newSession.durationMin * 60000,
      active: true,
      records: [],
    };
    const updated = [session, ...sessions];
    saveSessions(updated);
    setActiveSession(session);
    toast.success(`สร้าง Session: ${code}`);
  };

  const closeSession = (id) => {
    const updated = sessions.map(s => s.id === id ? { ...s, active: false } : s);
    saveSessions(updated);
    if (activeSession?.id === id) setActiveSession(null);
    toast('ปิด Session แล้ว');
  };

  const checkIn = () => {
    const { code, name, studentId } = studentView;
    if (!code || !name) { toast.error('กรุณากรอกรหัสและชื่อ'); return; }

    const session = sessions.find(s => s.id === code.toUpperCase() && s.active && Date.now() < s.expiresAt);
    if (!session) { toast.error('ไม่พบ Session หรือหมดเวลาแล้ว'); return; }

    const deviceId = getDeviceId();
    const alreadyChecked = session.records.some(r => r.deviceId === deviceId || (studentId && r.studentId === studentId));
    if (alreadyChecked) { toast.error('เช็คชื่อไปแล้ว'); return; }

    let gps = null;
    const doCheckin = (gpsData) => {
      const record = {
        id: Date.now().toString(),
        name,
        studentId,
        deviceId,
        checkedAt: Date.now(),
        gps: gpsData,
      };
      const updatedSessions = sessions.map(s =>
        s.id === session.id ? { ...s, records: [...s.records, record] } : s
      );
      saveSessions(updatedSessions);
      setStudentView(v => ({ ...v, step: 'success', session }));
      toast.success('เช็คชื่อแล้ว!');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doCheckin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => doCheckin(null),
        { timeout: 5000 }
      );
    } else {
      doCheckin(null);
    }
  };

  // Generate QR when activeSession changes
  useEffect(() => {
    if (activeSession && qrRef.current) {
      const url = `${window.location.origin}/teacher?att=${activeSession.id}`;
      generateQR(url, qrRef.current);
    }
  }, [activeSession]);

  const exportCSV = (session) => {
    const headers = ['ชื่อ', 'รหัสนักศึกษา', 'เวลาเช็คชื่อ', 'Latitude', 'Longitude'];
    const rows = session.records.map(r => [
      r.name,
      r.studentId || '-',
      new Date(r.checkedAt).toLocaleString('th-TH'),
      r.gps?.lat || '-',
      r.gps?.lng || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.courseName}_${session.id}.csv`;
    a.click();
    toast.success('Export แล้ว');
  };

  // Get live session data
  const liveSession = activeSession ? sessions.find(s => s.id === activeSession.id) : null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'teacher', label: '👩‍🏫 อาจารย์' }, { id: 'student', label: '👨‍🎓 นักศึกษา' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#fff' : 'none',
            color: mode === m.id ? '#ef4444' : '#64748b',
            fontWeight: mode === m.id ? 700 : 400,
            boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            fontSize: '14px', fontFamily: 'inherit',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ===== TEACHER ===== */}
      {mode === 'teacher' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Create session */}
          <div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>📅 สร้าง Session เช็คชื่อ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={lbl}>ชื่อวิชา *</label>
                  <input placeholder="เช่น วิชาการตลาด 101" value={newSession.courseName}
                    onChange={e => setNewSession(s => ({ ...s, courseName: e.target.value }))} style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>Section</label>
                    <input placeholder="เช่น 1, 2A" value={newSession.section}
                      onChange={e => setNewSession(s => ({ ...s, section: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>ระยะเวลา (นาที)</label>
                    <input type="number" min="15" max="300" value={newSession.durationMin}
                      onChange={e => setNewSession(s => ({ ...s, durationMin: parseInt(e.target.value) || 90 }))} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>หัวข้อการสอน</label>
                  <input placeholder="หัวข้อวันนี้..." value={newSession.topic}
                    onChange={e => setNewSession(s => ({ ...s, topic: e.target.value }))} style={inp} />
                </div>
                <button onClick={createSession} style={{
                  padding: '11px', borderRadius: '10px', border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700,
                  fontSize: '14px', fontFamily: 'inherit',
                }}>
                  🚀 เริ่ม Session
                </button>
              </div>
            </div>

            {/* Past sessions */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: '#1e293b' }}>📋 ประวัติ Session</h4>
              {sessions.length === 0 && <div style={{ color: '#94a3b8', fontSize: '13px' }}>ยังไม่มี Session</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {sessions.map(s => (
                  <div key={s.id} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{s.courseName}</span>
                      <span style={{
                        fontSize: '11px', padding: '1px 6px', borderRadius: '4px',
                        background: s.active && Date.now() < s.expiresAt ? '#dcfce7' : '#f1f5f9',
                        color: s.active && Date.now() < s.expiresAt ? '#16a34a' : '#94a3b8',
                      }}>
                        {s.active && Date.now() < s.expiresAt ? 'Active' : 'ปิดแล้ว'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Code: <b>{s.id}</b> | {s.records.length} คน | {new Date(s.createdAt).toLocaleDateString('th-TH')}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button onClick={() => setActiveSession(s)}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                        QR
                      </button>
                      <button onClick={() => exportCSV(s)}
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                        📥 Export
                      </button>
                      {s.active && Date.now() < s.expiresAt && (
                        <button onClick={() => closeSession(s.id)}
                          style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                          ปิด
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR + Live */}
          <div>
            {activeSession ? (
              <>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #fecaca', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, marginBottom: '4px' }}>🟢 Session Active</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '4px', color: '#1e293b' }}>{activeSession.id}</div>
                  <canvas ref={qrRef} style={{ borderRadius: '10px', margin: '12px auto', display: 'block' }} />
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    หมดเวลา: {new Date(activeSession.expiresAt).toLocaleTimeString('th-TH')}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/teacher?att=${activeSession.id}`); toast.success('คัดลอกแล้ว'); }}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                    >
                      📋 คัดลอก URL
                    </button>
                    <button onClick={() => closeSession(activeSession.id)}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                      ⏹ ปิด
                    </button>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                      👥 เข้าชั้นเรียน ({liveSession?.records?.length || 0} คน)
                    </h4>
                    {liveSession?.records?.length > 0 && (
                      <button onClick={() => exportCSV(liveSession)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit' }}>
                        📥 Export
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {(liveSession?.records || []).map((r, i) => (
                      <div key={r.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{r.name}</div>
                          {r.studentId && <div style={{ fontSize: '11px', color: '#64748b' }}>รหัส: {r.studentId}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(r.checkedAt).toLocaleTimeString('th-TH')}</div>
                          {r.gps && <div style={{ fontSize: '10px', color: '#94a3b8' }}>📍 GPS</div>}
                        </div>
                      </div>
                    ))}
                    {(liveSession?.records || []).length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
                        รอนักศึกษาสแกน QR...
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: '#fff5f5', borderRadius: '16px', padding: '32px', border: '2px dashed #fecaca', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                <div>สร้าง Session เพื่อแสดง QR Code</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STUDENT ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {studentView.step === 'join' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📅</div>
                <h2 style={{ margin: '0 0 4px', color: '#1e293b' }}>เช็คชื่อเข้าเรียน</h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>กรอกข้อมูลเพื่อเช็คชื่อ</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={lbl}>Session Code *</label>
                  <input placeholder="XXXXX" value={studentView.code}
                    onChange={e => setStudentView(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    style={{ ...inp, textAlign: 'center', fontSize: '20px', letterSpacing: '4px', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={lbl}>ชื่อ-นามสกุล *</label>
                  <input placeholder="ชื่อ นามสกุล" value={studentView.name}
                    onChange={e => setStudentView(v => ({ ...v, name: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>รหัสนักศึกษา</label>
                  <input placeholder="xxxxxxxx" value={studentView.studentId}
                    onChange={e => setStudentView(v => ({ ...v, studentId: e.target.value }))} style={inp} />
                </div>
                <button onClick={checkIn} style={{
                  padding: '13px', borderRadius: '10px', border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer',
                  fontWeight: 700, fontSize: '15px', fontFamily: 'inherit',
                }}>
                  ✅ เช็คชื่อ
                </button>
              </div>
            </div>
          )}

          {studentView.step === 'success' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', border: '1px solid #fecaca', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#16a34a', margin: '0 0 8px' }}>เช็คชื่อแล้ว!</h2>
              <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>ลงทะเบียนเข้าชั้นเรียนเรียบร้อย</p>
              <div style={{ background: '#f0fdfa', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{studentView.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date().toLocaleString('th-TH')}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' };
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
};
