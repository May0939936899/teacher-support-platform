'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, {
      width: 220,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
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

// Reverse geocoding via OpenStreetMap Nominatim (free, no API key)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=th`, {
      headers: { 'User-Agent': 'SPUBUS-Teacher-Support/1.0' },
    });
    const data = await res.json();
    if (data.display_name) {
      // Shorten the display name
      const parts = data.display_name.split(',').map(s => s.trim());
      return parts.slice(0, 3).join(', ');
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate distance between two GPS points (Haversine formula) in meters
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} ม.`;
  return `${(meters / 1000).toFixed(1)} กม.`;
}

export default function AttendanceTracker() {
  const [mode, setMode] = useState('teacher');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newSession, setNewSession] = useState({
    courseName: '', section: '', topic: '', durationMin: 90,
    useLocation: true, // Enable location verification
    locationName: '', // Custom name for the location
    locationLat: null,
    locationLng: null,
    locationRadius: 200, // Allowed radius in meters
  });
  const [studentView, setStudentView] = useState({ code: '', name: '', studentId: '', step: 'join' });
  const [studentLocation, setStudentLocation] = useState(null); // { lat, lng, address, accuracy }
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAddresses, setLocationAddresses] = useState({}); // cache: "lat,lng" -> address
  const [showMap, setShowMap] = useState(null); // record id to show map
  const qrRef = useRef(null);

  const API = '/api/teacher/attendance';
  const pollRef = useRef(null);

  // Load sessions from API on mount
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}?action=list`);
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions.map(s => ({
        ...s,
        courseName: s.course_name || s.courseName || '',
        locationName: s.location_name || s.locationName || '',
        locationLat: s.location_lat || s.locationLat || null,
        locationLng: s.location_lng || s.locationLng || null,
        locationRadius: s.location_radius || s.locationRadius || 200,
        createdAt: s.created_at || s.createdAt,
        expiresAt: s.expires_at || s.expiresAt,
        records: s.records || [],
      })));
    } catch { /* fallback: do nothing */ }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Poll for updates when teacher has active session
  useEffect(() => {
    if (mode === 'teacher' && activeSession) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API}?code=${activeSession.id}`);
          const data = await res.json();
          if (data.session) {
            const s = data.session;
            const mapped = {
              ...s,
              courseName: s.course_name || s.courseName || '',
              locationName: s.location_name || s.locationName || '',
              locationLat: s.location_lat || s.locationLat || null,
              locationLng: s.location_lng || s.locationLng || null,
              locationRadius: s.location_radius || s.locationRadius || 200,
              createdAt: s.created_at || s.createdAt,
              expiresAt: s.expires_at || s.expiresAt,
              records: s.records || [],
            };
            setSessions(prev => prev.map(x => x.id === s.id ? mapped : x));
            setActiveSession(mapped);
          }
        } catch {}
      }, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [mode, activeSession?.id]);

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
  };

  // Teacher: Get current location for session
  const getTeacherLocation = () => {
    if (!navigator.geolocation) { toast.error('เบราว์เซอร์ไม่รองรับ GPS'); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setNewSession(s => ({
          ...s,
          locationLat: lat,
          locationLng: lng,
          locationName: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        }));
        setLocationLoading(false);
        toast.success('📍 ได้ตำแหน่งแล้ว!');
      },
      (err) => {
        setLocationLoading(false);
        toast.error('ไม่สามารถเข้าถึง GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const createSession = async () => {
    if (!newSession.courseName) { toast.error('กรุณากรอกชื่อวิชา'); return; }
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const s = data.session;
      const mapped = {
        ...s,
        courseName: s.course_name || s.courseName || '',
        locationName: s.location_name || s.locationName || '',
        locationLat: s.location_lat || s.locationLat || null,
        locationLng: s.location_lng || s.locationLng || null,
        locationRadius: s.location_radius || s.locationRadius || 200,
        createdAt: s.created_at || s.createdAt,
        expiresAt: s.expires_at || s.expiresAt,
        records: s.records || [],
      };
      setSessions(prev => [mapped, ...prev]);
      setActiveSession(mapped);
      toast.success(`สร้าง Session: ${data.code}`);
    } catch (err) {
      toast.error(err.message || 'ไม่สามารถสร้าง Session');
    }
  };

  const closeSession = async (id) => {
    try {
      await fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: id, action: 'close' }),
      });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
      if (activeSession?.id === id) setActiveSession(null);
      toast('ปิด Session แล้ว');
    } catch { toast.error('ไม่สามารถปิด Session'); }
  };

  // Student: Get location before check-in
  const getStudentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const address = await reverseGeocode(lat, lng);
        setStudentLocation({ lat, lng, accuracy, address });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setStudentLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-get student location when in student mode
  useEffect(() => {
    if (mode === 'student' && studentView.step === 'join') {
      getStudentLocation();
    }
  }, [mode, studentView.step, getStudentLocation]);

  const checkIn = async (gpsOverride) => {
    const { code, name, studentId } = studentView;
    if (!code || !name) { toast.error('กรุณากรอกรหัสและชื่อ'); return; }

    const deviceId = getDeviceId();
    const gpsData = gpsOverride || studentLocation;

    const doCheckin = async (gps) => {
      try {
        const res = await fetch(API, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, name, studentId, deviceId, gps }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error); return; }
        setStudentView(v => ({ ...v, step: 'success', session: data.session, record: data.record }));
        if (data.withinRange === false) {
          toast.success('เช็กชื่อแล้ว (ตำแหน่งอยู่นอกระยะ)');
        } else {
          toast.success('เช็กชื่อแล้ว! ✅');
        }
      } catch {
        toast.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
      }
    };

    if (gpsData) {
      await doCheckin(gpsData);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const address = await reverseGeocode(lat, lng);
          await doCheckin({ lat, lng, accuracy, address });
        },
        () => doCheckin(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      await doCheckin(null);
    }
  };

  // Generate QR when activeSession changes
  useEffect(() => {
    if (activeSession && qrRef.current) {
      const url = `${window.location.origin}/teacher?att=${activeSession.id}`;
      generateQR(url, qrRef.current);
    }
  }, [activeSession]);

  // Lazy load addresses for records
  const loadAddress = useCallback(async (lat, lng) => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (locationAddresses[key]) return locationAddresses[key];
    const addr = await reverseGeocode(lat, lng);
    if (addr) {
      setLocationAddresses(prev => ({ ...prev, [key]: addr }));
    }
    return addr;
  }, [locationAddresses]);

  const exportCSV = (session) => {
    const headers = ['ลำดับ', 'ชื่อ', 'รหัสนักศึกษา', 'เวลาเช็กชื่อ', 'Latitude', 'Longitude', 'สถานที่', 'ระยะห่าง(ม.)', 'อยู่ในระยะ'];
    const rows = session.records.map((r, i) => [
      i + 1,
      r.name,
      r.studentId || '-',
      new Date(r.checkedAt).toLocaleString('th-TH'),
      r.gps?.lat || '-',
      r.gps?.lng || '-',
      r.address || '-',
      r.distance !== null ? r.distance : '-',
      r.withinRange !== undefined ? (r.withinRange ? 'ใช่' : 'ไม่') : '-',
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
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'teacher', label: '👩‍🏫 อาจารย์' }, { id: 'student', label: '👨‍🎓 นักศึกษา' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#fff' : 'none',
            color: mode === m.id ? CI.cyan : '#64748b',
            fontWeight: mode === m.id ? 700 : 400,
            boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            fontSize: '16px', fontFamily: 'inherit',
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
            <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#1e293b', fontWeight: 800 }}>📅 สร้าง Session เช็กชื่อ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

                {/* ===== LOCATION SECTION ===== */}
                <div style={{
                  background: newSession.useLocation ? `${CI.cyan}06` : '#f8fafc',
                  borderRadius: '14px', padding: '16px',
                  border: `1px solid ${newSession.useLocation ? CI.cyan + '30' : '#e2e8f0'}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: newSession.useLocation ? '14px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>📍</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>ยืนยันตำแหน่ง GPS</span>
                    </div>
                    <button onClick={() => setNewSession(s => ({ ...s, useLocation: !s.useLocation }))}
                      style={{
                        width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
                        background: newSession.useLocation ? CI.cyan : '#cbd5e1',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '2px',
                        left: newSession.useLocation ? '24px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>

                  {newSession.useLocation && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                        ตั้งค่าตำแหน่งห้องเรียน — ระบบจะตรวจสอบว่านักศึกษาอยู่ในรัศมีที่กำหนด
                      </div>

                      {newSession.locationLat ? (
                        <div style={{
                          background: '#fff', borderRadius: '10px', padding: '12px',
                          border: `1px solid ${CI.cyan}20`, marginBottom: '10px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px' }}>✅</span>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>ตั้งตำแหน่งแล้ว</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, marginBottom: '4px' }}>
                            {newSession.locationName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {newSession.locationLat.toFixed(6)}, {newSession.locationLng.toFixed(6)}
                          </div>
                          <button onClick={getTeacherLocation}
                            style={{ marginTop: '8px', fontSize: '12px', padding: '4px 12px', borderRadius: '6px', border: `1px solid ${CI.cyan}30`, background: '#fff', color: CI.cyan, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            🔄 ตั้งใหม่
                          </button>
                        </div>
                      ) : (
                        <button onClick={getTeacherLocation} disabled={locationLoading}
                          style={{
                            width: '100%', padding: '12px', borderRadius: '10px',
                            border: `2px dashed ${CI.cyan}40`, background: `${CI.cyan}06`,
                            color: CI.cyan, cursor: locationLoading ? 'wait' : 'pointer',
                            fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
                          }}>
                          {locationLoading ? '🔄 กำลังหาตำแหน่ง...' : '📍 ตั้งตำแหน่งปัจจุบัน (GPS)'}
                        </button>
                      )}

                      <div style={{ marginTop: '10px' }}>
                        <label style={{ ...lbl, fontSize: '13px' }}>รัศมีที่อนุญาต (เมตร)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {[100, 200, 500, 1000].map(r => (
                            <button key={r} onClick={() => setNewSession(s => ({ ...s, locationRadius: r }))}
                              style={{
                                padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                border: newSession.locationRadius === r ? `2px solid ${CI.cyan}` : '1px solid #e2e8f0',
                                background: newSession.locationRadius === r ? `${CI.cyan}10` : '#fff',
                                color: newSession.locationRadius === r ? CI.cyan : '#64748b',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              {r < 1000 ? `${r}ม.` : `${r / 1000}กม.`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={createSession} style={{
                  padding: '14px', borderRadius: '12px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                  color: '#fff', cursor: 'pointer', fontWeight: 800,
                  fontSize: '16px', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${CI.cyan}30`,
                }}>
                  🚀 เริ่ม Session
                </button>
              </div>
            </div>

            {/* Past sessions */}
            <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 700 }}>📋 ประวัติ Session</h4>
                {sessions.length > 0 && (
                  <button onClick={async () => { if (confirm('ลบประวัติ Session ทั้งหมด?')) { await fetch(`${API}?action=all`, { method: 'DELETE' }); setSessions([]); setActiveSession(null); toast.success('ลบประวัติทั้งหมดแล้ว'); } }}
                    style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    🗑 ลบทั้งหมด
                  </button>
                )}
              </div>
              {sessions.length === 0 && <div style={{ color: '#94a3b8', fontSize: '14px', padding: '16px 0', textAlign: 'center' }}>ยังไม่มี Session</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                {sessions.map(s => (
                  <div key={s.id} style={{ padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{s.courseName}</span>
                      <span style={{
                        fontSize: '12px', padding: '2px 10px', borderRadius: '6px',
                        background: s.active && Date.now() < s.expiresAt ? '#dcfce7' : '#f1f5f9',
                        color: s.active && Date.now() < s.expiresAt ? '#16a34a' : '#94a3b8',
                        fontWeight: 600,
                      }}>
                        {s.active && Date.now() < s.expiresAt ? '🟢 Active' : 'ปิดแล้ว'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      Code: <b>{s.id}</b> | {s.records.length} คน | {new Date(s.createdAt).toLocaleDateString('th-TH')}
                    </div>
                    {s.locationName && (
                      <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        📍 {s.locationName} (รัศมี {s.locationRadius || 200}ม.)
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => setActiveSession(s)}
                        style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '8px', border: `1px solid ${CI.cyan}30`, background: `${CI.cyan}08`, color: CI.cyan, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        📱 QR
                      </button>
                      <button onClick={() => exportCSV(s)}
                        style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        📥 Export
                      </button>
                      {s.active && Date.now() < s.expiresAt && (
                        <button onClick={() => closeSession(s.id)}
                          style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                          ⏹ ปิด
                        </button>
                      )}
                      <button onClick={async () => { if (confirm(`ลบ Session ${s.courseName || s.id}?`)) { await fetch(`${API}?code=${s.id}`, { method: 'DELETE' }); setSessions(prev => prev.filter(x => x.id !== s.id)); if (activeSession?.id === s.id) setActiveSession(null); toast.success('ลบ Session แล้ว'); } }}
                        style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        🗑 ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR + Live Records */}
          <div>
            {activeSession ? (
              <>
                <div style={{
                  background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`,
                  borderRadius: '20px', padding: '28px', marginBottom: '16px', textAlign: 'center', color: '#fff',
                  boxShadow: '0 8px 32px rgba(11,11,36,0.3)',
                }}>
                  <div style={{ fontSize: '14px', color: CI.cyan, fontWeight: 700, marginBottom: '8px' }}>🟢 Session Active</div>
                  <div style={{
                    fontSize: '48px', fontWeight: 900, letterSpacing: '10px',
                    background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>{activeSession.id}</div>
                  <canvas ref={qrRef} style={{ borderRadius: '14px', margin: '16px auto', display: 'block', background: '#fff', padding: '8px' }} />

                  {activeSession.locationName && (
                    <div style={{ fontSize: '13px', color: '#a5f3fc', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      📍 {activeSession.locationName}
                      <span style={{ background: `${CI.cyan}30`, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        รัศมี {activeSession.locationRadius || 200}ม.
                      </span>
                    </div>
                  )}

                  <div style={{ fontSize: '13px', opacity: 0.7 }}>
                    หมดเวลา: {new Date(activeSession.expiresAt).toLocaleTimeString('th-TH')}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/teacher?att=${activeSession.id}`); toast.success('📋 คัดลอกแล้ว'); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${CI.cyan}40`, background: 'transparent', color: CI.cyan, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 600 }}
                    >
                      📋 คัดลอก URL
                    </button>
                    <button onClick={() => closeSession(activeSession.id)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: 700 }}>
                      ⏹ ปิด Session
                    </button>
                  </div>
                </div>

                {/* Records with location */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: 700 }}>
                      👥 เข้าชั้นเรียน ({liveSession?.records?.length || 0} คน)
                    </h4>
                    {liveSession?.records?.length > 0 && (
                      <button onClick={() => exportCSV(liveSession)} style={{
                        fontSize: '13px', padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      }}>
                        📥 Export CSV
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {(liveSession?.records || []).map((r, i) => {
                      const hasLocation = r.gps?.lat && r.gps?.lng;
                      const addrKey = hasLocation ? `${r.gps.lat.toFixed(5)},${r.gps.lng.toFixed(5)}` : null;
                      const cachedAddr = addrKey ? locationAddresses[addrKey] : null;

                      return (
                        <div key={r.id} style={{
                          padding: '14px', borderRadius: '12px', marginBottom: '8px',
                          border: `1px solid ${r.withinRange === false ? '#fecaca' : '#f1f5f9'}`,
                          background: r.withinRange === false ? '#fef2f2' : '#fafafa',
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{
                              width: '32px', height: '32px', borderRadius: '10px',
                              background: r.withinRange === false ? '#fee2e2' : '#dcfce7',
                              color: r.withinRange === false ? '#ef4444' : '#16a34a',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: 800, flexShrink: 0,
                            }}>
                              {i + 1}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{r.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                {r.studentId && `รหัส: ${r.studentId} | `}
                                {new Date(r.checkedAt).toLocaleTimeString('th-TH')}
                              </div>
                            </div>

                            {/* Location badge */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {hasLocation ? (
                                <div>
                                  <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                    background: r.withinRange === false ? '#fee2e2' : '#dcfce7',
                                    color: r.withinRange === false ? '#ef4444' : '#16a34a',
                                  }}>
                                    {r.withinRange === false ? '⚠️ นอกระยะ' : '✅ ในระยะ'}
                                    {r.distance !== null && ` (${formatDistance(r.distance)})`}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8', padding: '3px 8px', background: '#f1f5f9', borderRadius: '6px' }}>
                                  ❌ ไม่มี GPS
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location detail row */}
                          {hasLocation && (
                            <div style={{
                              marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9',
                              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                            }}>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                📍 {r.address || cachedAddr || `${r.gps.lat.toFixed(5)}, ${r.gps.lng.toFixed(5)}`}
                              </span>
                              {!r.address && !cachedAddr && (
                                <button onClick={() => loadAddress(r.gps.lat, r.gps.lng)}
                                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', color: CI.cyan, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  🔍 ดูสถานที่
                                </button>
                              )}
                              <a href={`https://www.google.com/maps?q=${r.gps.lat},${r.gps.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${CI.cyan}30`, background: `${CI.cyan}08`, color: CI.cyan, textDecoration: 'none', fontWeight: 600 }}>
                                🗺️ Google Maps
                              </a>
                              {r.gps.accuracy && (
                                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                                  ±{Math.round(r.gps.accuracy)}ม.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(liveSession?.records || []).length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '40px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.5 }}>⏳</div>
                        รอนักศึกษาสแกน QR...
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                background: `${CI.cyan}06`, borderRadius: '20px', padding: '48px 24px',
                border: `2px dashed ${CI.cyan}25`, textAlign: 'center', color: '#94a3b8',
              }}>
                <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.5 }}>📅</div>
                <div style={{ fontSize: '16px' }}>สร้าง Session เพื่อแสดง QR Code</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STUDENT ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '550px', margin: '0 auto' }}>
          {studentView.step === 'join' && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '56px', marginBottom: '8px' }}>📅</div>
                <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '24px', fontWeight: 800 }}>เช็กชื่อเข้าเรียน</h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>กรอกข้อมูลเพื่อเช็กชื่อ</p>
              </div>

              {/* Location status for student */}
              <div style={{
                background: studentLocation ? '#f0fdf4' : locationLoading ? `${CI.cyan}06` : '#fef2f2',
                borderRadius: '14px', padding: '14px 16px', marginBottom: '20px',
                border: `1px solid ${studentLocation ? '#bbf7d0' : locationLoading ? CI.cyan + '20' : '#fecaca'}`,
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '22px' }}>
                  {studentLocation ? '✅' : locationLoading ? '🔄' : '⚠️'}
                </span>
                <div style={{ flex: 1 }}>
                  {studentLocation ? (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>ตรวจจับตำแหน่งแล้ว</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        📍 {studentLocation.address || `${studentLocation.lat.toFixed(5)}, ${studentLocation.lng.toFixed(5)}`}
                      </div>
                      {studentLocation.accuracy && (
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ความแม่นยำ: ±{Math.round(studentLocation.accuracy)}ม.</div>
                      )}
                    </>
                  ) : locationLoading ? (
                    <div style={{ fontSize: '14px', color: CI.cyan, fontWeight: 600 }}>กำลังหาตำแหน่ง GPS...</div>
                  ) : (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>ไม่สามารถเข้าถึง GPS</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>กรุณาอนุญาตการเข้าถึงตำแหน่ง</div>
                    </>
                  )}
                </div>
                {!studentLocation && !locationLoading && (
                  <button onClick={getStudentLocation} style={{
                    padding: '8px 14px', borderRadius: '8px', border: `1px solid ${CI.cyan}30`,
                    background: `${CI.cyan}08`, color: CI.cyan, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0,
                  }}>
                    🔄 ลองอีกครั้ง
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={lbl}>Session Code *</label>
                  <input placeholder="XXXXX" value={studentView.code}
                    onChange={e => setStudentView(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    style={{ ...inp, textAlign: 'center', fontSize: '28px', letterSpacing: '8px', fontWeight: 900, padding: '16px' }} />
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
                  padding: '16px', borderRadius: '14px', border: 'none',
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                  color: '#fff', cursor: 'pointer',
                  fontWeight: 800, fontSize: '18px', fontFamily: 'inherit',
                  boxShadow: `0 4px 16px ${CI.cyan}30`,
                }}>
                  ✅ เช็กชื่อ
                </button>
              </div>
            </div>
          )}

          {studentView.step === 'success' && (
            <div style={{ background: '#fff', borderRadius: '24px', padding: '44px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '72px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ color: '#16a34a', margin: '0 0 8px', fontSize: '26px', fontWeight: 800 }}>เช็กชื่อสำเร็จ!</h2>
              <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '15px' }}>ลงทะเบียนเข้าชั้นเรียนเรียบร้อย</p>

              <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '20px', textAlign: 'left' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>ชื่อ</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{studentView.name}</span>
                  </div>
                  {studentView.studentId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>รหัสนักศึกษา</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{studentView.studentId}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>เวลา</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{new Date().toLocaleString('th-TH')}</span>
                  </div>
                </div>
              </div>

              {/* Location confirmation */}
              {studentView.record?.gps && (
                <div style={{
                  background: studentView.record.withinRange ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '16px', padding: '20px', marginTop: '14px', textAlign: 'left',
                  border: `1px solid ${studentView.record.withinRange ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{studentView.record.withinRange ? '📍' : '⚠️'}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: studentView.record.withinRange ? '#16a34a' : '#ef4444' }}>
                      {studentView.record.withinRange ? 'ตำแหน่งยืนยันแล้ว' : 'ตำแหน่งอยู่นอกรัศมี'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {studentView.record.address || studentLocation?.address || `${studentView.record.gps.lat.toFixed(5)}, ${studentView.record.gps.lng.toFixed(5)}`}
                  </div>
                  {studentView.record.distance !== null && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                      ระยะห่างจากห้องเรียน: {formatDistance(studentView.record.distance)}
                    </div>
                  )}
                </div>
              )}

              {!studentView.record?.gps && (
                <div style={{
                  background: '#fef3c7', borderRadius: '16px', padding: '16px', marginTop: '14px',
                  fontSize: '13px', color: '#92400e', textAlign: 'center',
                }}>
                  ⚠️ ไม่สามารถเข้าถึง GPS — เช็กชื่อสำเร็จแต่ไม่มีข้อมูลตำแหน่ง
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '14px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = {
  width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e2e8f0',
  fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
  transition: 'border 0.2s',
};
