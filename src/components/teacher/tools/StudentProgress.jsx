'use client';
/* ────────────────────────────────────────────────────────────────────────────
   GradeBook — Transparent attendance/score tracking for a class.
   Teacher creates a class with grade components → gets a code →
   shares code with students → students self-enroll + check submissions →
   teacher enters scores → everyone can audit changes.
   ──────────────────────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";
const STORAGE = 'teacher_gradebooks_v1';

const lbl = { fontSize: 13, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 };
const inp = {
  width: '100%', padding: '10px 13px', borderRadius: 10, border: '2px solid #e2e8f0',
  fontSize: 14, fontFamily: FONT, outline: 'none', background: '#fff', color: '#1e293b',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
};

// ── localStorage cache of teacher's class codes ──────────────────────────────
function loadCodes() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
}
function saveCodes(arr) {
  try { localStorage.setItem(STORAGE, JSON.stringify(arr.slice(0, 50))); } catch {}
}

// ── CSV / Excel parsing ──────────────────────────────────────────────────────
// Returns array of row arrays (e.g. [[col1, col2], ...]) — header NOT auto-stripped
async function parseSpreadsheet(file) {
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'xlsx' || ext === 'xls') {
    // Dynamic import xlsx (~250KB) only when user uploads Excel
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  }

  // CSV / TSV — simple splitter (handles quoted fields with commas)
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const isTabSep = lines[0]?.includes('\t');
  const sep = isTabSep ? '\t' : ',';
  return lines.map(line => {
    const cells = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === sep && !inQuotes) { cells.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    cells.push(cur.trim());
    return cells;
  });
}

// Detect if first row looks like a header (heuristic: contains text like 'รหัส', 'student', 'ชื่อ')
function isHeaderRow(row) {
  const joined = row.join('|').toLowerCase();
  return /รหัส|student|id|ชื่อ|name|first|last|นามสกุล|คะแนน|score/i.test(joined);
}

export default function GradeBook() {
  const [view, setView]               = useState('list');  // list | create | manage
  const [savedClasses, setSavedClasses] = useState([]);
  const [activeCode, setActiveCode]   = useState('');
  const [classData, setClassData]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const pollRef = useRef(null);

  // ── Form state for creating a class ───────────────────────────────────────
  const [form, setForm] = useState({
    course: '', courseName: '', section: '1', teacher: '',
    components: [
      { id: 'c1', name: 'งานที่ 1', weight: 10, maxScore: 10, deadline: '' },
      { id: 'c2', name: 'งานที่ 2', weight: 10, maxScore: 10, deadline: '' },
      { id: 'c3', name: 'มิดเทอม', weight: 30, maxScore: 100, deadline: '' },
      { id: 'c4', name: 'ปลายภาค', weight: 50, maxScore: 100, deadline: '' },
    ],
    bonus: [{ id: 'b1', name: 'เข้าร่วมกิจกรรม', maxScore: 5 }],
  });

  useEffect(() => { setSavedClasses(loadCodes()); }, []);

  // Polling for live updates while managing a class
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!activeCode || view !== 'manage') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    setFetchError(null);
    setClassData(null);
    fetchClass(activeCode);
    pollRef.current = setInterval(() => fetchClass(activeCode), 6000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCode, view]);

  const fetchClass = async (code) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/teacher/gradebook?code=${code.toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setClassData(data);
        setFetchError(null);
      } else {
        setFetchError(data.error || 'ไม่พบห้องเรียน');
      }
    } catch {
      setFetchError('เชื่อมต่อไม่ได้');
    }
  };

  const removeFromLocal = (code) => {
    if (!confirm(`ลบ ${code} ออกจากรายการเครื่องนี้?\n(ห้องในเซิร์ฟเวอร์ไม่ถูกลบ)`)) return;
    const updated = savedClasses.filter(c => c.code !== code);
    setSavedClasses(updated); saveCodes(updated);
    if (activeCode === code) {
      setActiveCode(''); setClassData(null); setView('list');
    }
  };

  // Recreate a class with same components/bonus when server lost it
  const recreateMissingClass = async (oldCode) => {
    const cached = savedClasses.find(c => c.code === oldCode);
    if (!cached || !cached.fullForm) {
      alert('ไม่มีข้อมูลห้องเดิมในเครื่อง — กรุณาสร้างใหม่เอง');
      return;
    }
    const f = cached.fullForm;
    if (!confirm(`สร้างห้องใหม่ด้วยข้อมูลเดิม:\n• ${f.courseName} (${f.course} กลุ่ม ${f.section})\n• ${f.components.length} ชิ้นงาน + ${f.bonus.length} คะแนนพิเศษ\n\nรหัสเก่า ${oldCode} จะถูกแทนที่ด้วยรหัสใหม่`)) return;
    try {
      const res = await fetch('/api/teacher/gradebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...f }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const updated = [
        { code: data.code, course: f.course, courseName: f.courseName, section: f.section, createdAt: Date.now(), fullForm: f },
        ...savedClasses.filter(c => c.code !== oldCode),
      ];
      setSavedClasses(updated); saveCodes(updated);
      setActiveCode(data.code); setClassData(data.class); setFetchError(null);
      toast.success(`✅ สร้างห้องใหม่: ${data.code}`);
    } catch (e) {
      toast.error(`สร้างไม่สำเร็จ: ${e.message}`);
    }
  };

  const totalWeight = form.components.reduce((s, c) => s + (Number(c.weight) || 0), 0);

  const createClass = async () => {
    if (!form.course || !form.courseName) { toast.error('กรอกรหัสและชื่อวิชา'); return; }
    if (Math.abs(totalWeight - 100) > 0.5) {
      toast.error(`น้ำหนักรวม = ${totalWeight}% — ต้องเป็น 100%`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/gradebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Cache FULL form (course/components/bonus) so we can recreate if
      // server ever loses the class
      const updated = [{
        code: data.code, course: form.course, courseName: form.courseName,
        section: form.section, createdAt: Date.now(),
        fullForm: { ...form },  // ← full payload for recreation
      }, ...savedClasses];
      setSavedClasses(updated); saveCodes(updated);
      setActiveCode(data.code); setClassData(data.class); setView('manage');
      toast.success(`สร้างห้องเรียน ${data.code} สำเร็จ!`);
    } catch (e) {
      toast.error(e.message || 'สร้างห้องไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const openClass = async (code) => {
    setActiveCode(code);
    setView('manage');
    await fetchClass(code);
  };

  const addStudent = async (studentId, firstName, lastName) => {
    const res = await fetch('/api/teacher/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_student', code: activeCode, studentId, firstName, lastName }),
    });
    const data = await res.json();
    if (res.ok) { toast.success('เพิ่มแล้ว'); fetchClass(activeCode); }
    else toast.error(data.error);
  };

  const removeStudent = async (studentId) => {
    if (!confirm(`ลบนักศึกษา ${studentId}?`)) return;
    const res = await fetch('/api/teacher/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_student', code: activeCode, studentId }),
    });
    if (res.ok) { toast.success('ลบแล้ว'); fetchClass(activeCode); }
  };

  // Bulk import roster from CSV/Excel
  const importRoster = async (file) => {
    const tid = toast.loading('กำลังอ่านไฟล์...');
    try {
      const rows = await parseSpreadsheet(file);
      const dataRows = rows[0] && isHeaderRow(rows[0]) ? rows.slice(1) : rows;
      let added = 0, dup = 0, skipped = 0;
      for (const row of dataRows) {
        const studentId = String(row[0] || '').trim();
        const firstName = String(row[1] || '').trim();
        const lastName  = String(row[2] || '').trim();
        if (!studentId || !firstName) { skipped++; continue; }
        const res = await fetch('/api/teacher/gradebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_student', code: activeCode, studentId, firstName, lastName }),
        });
        const data = await res.json();
        if (res.ok) added++;
        else if (data.error?.includes('มีอยู่แล้ว')) dup++;
        else skipped++;
      }
      await fetchClass(activeCode);
      toast.success(`✅ นำเข้า ${added} คน${dup ? ` · ซ้ำ ${dup}` : ''}${skipped ? ` · ข้าม ${skipped}` : ''}`, { id: tid, duration: 5000 });
    } catch (e) {
      toast.error(`อ่านไฟล์ไม่ได้: ${e.message}`, { id: tid });
    }
  };

  // Bulk import scores from CSV/Excel
  // Format: col0=studentId, col1=firstName, col2=lastName, col3+ = scores per component (in order)
  const importScores = async (file) => {
    const tid = toast.loading('กำลังอ่านไฟล์...');
    try {
      const rows = await parseSpreadsheet(file);
      if (rows.length === 0) throw new Error('ไฟล์ว่างเปล่า');

      // Try to detect header — if row[0] looks like header, use it to map columns
      const firstRow = rows[0];
      const hasHeader = isHeaderRow(firstRow);
      const dataRows = hasHeader ? rows.slice(1) : rows;

      const components = classData?.components || [];
      const bonusItems = classData?.bonus || [];

      // Map header columns to component IDs (by name match if header provided)
      // Otherwise fallback: col 3 → comp[0], col 4 → comp[1], etc.
      let colToComp = []; // array of {id, isBonus} per column index (0-based from col3)

      if (hasHeader && firstRow.length > 3) {
        for (let i = 3; i < firstRow.length; i++) {
          const colName = String(firstRow[i] || '').trim().toLowerCase();
          if (!colName) continue;
          const c = components.find(x => x.name.toLowerCase() === colName || x.name.toLowerCase().includes(colName) || colName.includes(x.name.toLowerCase()));
          if (c) { colToComp[i - 3] = { id: c.id, isBonus: false }; continue; }
          const b = bonusItems.find(x => x.name.toLowerCase() === colName || x.name.toLowerCase().includes(colName) || colName.includes(x.name.toLowerCase()));
          if (b) { colToComp[i - 3] = { id: b.id, isBonus: true }; continue; }
        }
      }

      // Fallback: positional mapping
      if (colToComp.filter(Boolean).length === 0) {
        components.forEach((c, idx) => { colToComp[idx] = { id: c.id, isBonus: false }; });
        bonusItems.forEach((b, idx) => { colToComp[components.length + idx] = { id: b.id, isBonus: true }; });
      }

      let updated = 0, notFound = 0, scored = 0;
      const studentMap = new Map((classData?.students || []).map(s => [String(s.studentId), s]));

      for (const row of dataRows) {
        const studentId = String(row[0] || '').trim();
        if (!studentId) continue;
        if (!studentMap.has(studentId)) { notFound++; continue; }

        for (let i = 3; i < row.length; i++) {
          const cell = row[i];
          if (cell === '' || cell === null || cell === undefined) continue;
          const score = Number(cell);
          if (isNaN(score)) continue;
          const target = colToComp[i - 3];
          if (!target) continue;
          await fetch('/api/teacher/gradebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_score',
              code: activeCode,
              studentId, componentId: target.id, score, isBonus: target.isBonus,
            }),
          });
          scored++;
        }
        updated++;
      }
      await fetchClass(activeCode);
      toast.success(`✅ อัปเดต ${updated} คน · ${scored} คะแนน${notFound ? ` · ไม่พบ ${notFound} คน` : ''}`, { id: tid, duration: 5000 });
    } catch (e) {
      toast.error(`อ่านไฟล์ไม่ได้: ${e.message}`, { id: tid });
    }
  };

  const updateScore = async (studentId, componentId, score, isBonus) => {
    await fetch('/api/teacher/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_score', code: activeCode, studentId, componentId, score, isBonus }),
    });
    fetchClass(activeCode);
  };

  // ════════════════════════════════════════════════════════════════════════
  // CREATE VIEW
  // ════════════════════════════════════════════════════════════════════════
  if (view === 'create') {
    return (
      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', fontFamily: FONT }}>
        <button onClick={() => setView('list')} style={{ marginBottom: 16, padding: '6px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: FONT, color: '#64748b' }}>← กลับ</button>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#0f172a' }}>📚 สร้างห้องเรียนใหม่</h2>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>ตั้งค่าวิชา + สัดส่วนคะแนน — ระบบจะออก Code ให้แชร์กับนักศึกษา</p>

          {/* Course info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={lbl}>รหัสวิชา *</label>
              <input value={form.course} onChange={e => setForm({...form, course: e.target.value})} placeholder="MGT3367" style={inp} />
            </div>
            <div>
              <label style={lbl}>ชื่อวิชา *</label>
              <input value={form.courseName} onChange={e => setForm({...form, courseName: e.target.value})} placeholder="การตัดสินใจทางธุรกิจ" style={inp} />
            </div>
            <div>
              <label style={lbl}>กลุ่มเรียน</label>
              <input value={form.section} onChange={e => setForm({...form, section: e.target.value})} placeholder="101" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={lbl}>ชื่ออาจารย์</label>
            <input value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})} placeholder="อ.สมชาย ใจดี" style={inp} />
          </div>

          {/* Components */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>📊 สัดส่วนคะแนนเก็บ</h3>
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: Math.abs(totalWeight - 100) < 0.5 ? '#16a34a' : '#dc2626',
                background: Math.abs(totalWeight - 100) < 0.5 ? '#dcfce7' : '#fee2e2',
                borderRadius: 8, padding: '4px 12px',
              }}>
                รวม: {totalWeight}% {Math.abs(totalWeight - 100) < 0.5 ? '✓' : '— ต้องเป็น 100%'}
              </div>
            </div>
            {form.components.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={c.name} onChange={e => setForm({...form, components: form.components.map((x, j) => j === i ? {...x, name: e.target.value} : x)})} placeholder="ชื่อชิ้นงาน" style={inp} />
                <input type="number" value={c.weight} onChange={e => setForm({...form, components: form.components.map((x, j) => j === i ? {...x, weight: Number(e.target.value) || 0} : x)})} placeholder="%" style={{...inp, textAlign: 'center'}} />
                <input type="number" value={c.maxScore} onChange={e => setForm({...form, components: form.components.map((x, j) => j === i ? {...x, maxScore: Number(e.target.value) || 100} : x)})} placeholder="เต็ม" style={{...inp, textAlign: 'center'}} />
                <input type="date" value={c.deadline} onChange={e => setForm({...form, components: form.components.map((x, j) => j === i ? {...x, deadline: e.target.value} : x)})} style={inp} />
                <button onClick={() => setForm({...form, components: form.components.filter((_, j) => j !== i)})} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
              </div>
            ))}
            <button onClick={() => setForm({...form, components: [...form.components, { id: 'c' + Date.now(), name: '', weight: 0, maxScore: 100, deadline: '' }]})} style={{ background: '#dbeafe', color: '#1e40af', border: '2px dashed #93c5fd', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: FONT, fontSize: 13 }}>+ เพิ่มงาน</button>
          </div>

          {/* Bonus */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>🎁 คะแนนพิเศษ <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(บวกเพิ่มจาก 100)</span></h3>
            {form.bonus.map((b, i) => (
              <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={b.name} onChange={e => setForm({...form, bonus: form.bonus.map((x, j) => j === i ? {...x, name: e.target.value} : x)})} placeholder="ชื่อคะแนนพิเศษ" style={inp} />
                <input type="number" value={b.maxScore} onChange={e => setForm({...form, bonus: form.bonus.map((x, j) => j === i ? {...x, maxScore: Number(e.target.value) || 5} : x)})} placeholder="เต็ม" style={{...inp, textAlign: 'center'}} />
                <button onClick={() => setForm({...form, bonus: form.bonus.filter((_, j) => j !== i)})} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
            <button onClick={() => setForm({...form, bonus: [...form.bonus, { id: 'b' + Date.now(), name: '', maxScore: 5 }]})} style={{ background: '#fef3c7', color: '#92400e', border: '2px dashed #fbbf24', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: FONT, fontSize: 13 }}>+ เพิ่มคะแนนพิเศษ</button>
          </div>

          <button onClick={createClass} disabled={loading || Math.abs(totalWeight - 100) >= 0.5}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: (loading || Math.abs(totalWeight - 100) >= 0.5) ? '#e2e8f0' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: (loading || Math.abs(totalWeight - 100) >= 0.5) ? '#94a3b8' : '#fff',
              cursor: (loading || Math.abs(totalWeight - 100) >= 0.5) ? 'not-allowed' : 'pointer',
              fontFamily: FONT, fontWeight: 800, fontSize: 17,
              boxShadow: (loading || Math.abs(totalWeight - 100) >= 0.5) ? 'none' : `0 6px 20px ${CI.cyan}40`,
            }}>
            {loading ? 'กำลังสร้าง...' : '🚀 สร้างห้องเรียน'}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // MANAGE VIEW
  // ════════════════════════════════════════════════════════════════════════
  // ── MANAGE: loading / error state ────────────────────────────────────────
  if (view === 'manage' && !classData) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: '0 auto', fontFamily: FONT, textAlign: 'center' }}>
        <button onClick={() => { setView('list'); setActiveCode(''); setFetchError(null); }} style={{ marginBottom: 24, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontFamily: FONT }}>← กลับ</button>
        {fetchError ? (() => {
          const cached = savedClasses.find(c => c.code === activeCode);
          const canRecreate = cached && cached.fullForm;
          return (
            <div style={{ background: '#fff', borderRadius: 16, padding: '36px 28px', border: '2px solid #fecaca', boxShadow: '0 4px 16px rgba(239,68,68,0.1)', textAlign: 'left' }}>
              <div style={{ fontSize: 56, marginBottom: 14, textAlign: 'center' }}>😕</div>
              <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 20, textAlign: 'center' }}>
                ห้อง <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>{activeCode}</span> หายจากเซิร์ฟเวอร์
              </h2>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13, textAlign: 'center' }}>
                ข้อมูลที่คุณตั้งค่าไว้ในเครื่องยังครบถ้วน · คลิกปุ่มเขียวเพื่อสร้างใหม่ทันที
              </p>
              {canRecreate && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 6 }}>📋 ข้อมูลที่เก็บไว้:</div>
                  <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.7 }}>
                    <div><strong>วิชา:</strong> {cached.fullForm.courseName} ({cached.fullForm.course})</div>
                    <div><strong>กลุ่ม:</strong> {cached.fullForm.section} · <strong>ครู:</strong> {cached.fullForm.teacher || '—'}</div>
                    <div><strong>ชิ้นงาน:</strong> {cached.fullForm.components.length} ชิ้น · <strong>คะแนนพิเศษ:</strong> {cached.fullForm.bonus.length} รายการ</div>
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
                <button onClick={() => { setFetchError(null); fetchClass(activeCode); }} style={{
                  padding: '12px 20px', borderRadius: 10, border: 'none',
                  background: CI.cyan, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14,
                }}>🔄 ลองใหม่</button>
                <button onClick={() => removeFromLocal(activeCode)} style={{
                  padding: '12px 20px', borderRadius: 10, border: '1px solid #fecaca',
                  background: '#fff', color: '#dc2626', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14,
                }}>🗑️ ลบออกจากรายการ</button>
              </div>
              <div style={{ marginTop: 16, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e', textAlign: 'center' }}>
                💡 รหัสห้องใหม่จะแทนที่ของเก่า · นักศึกษาที่เคย enroll จะต้องเข้าใหม่ (ถ้ามี)
              </div>
            </div>
          );
        })() : (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 56, marginBottom: 14, animation: 'pulse 1.6s ease infinite' }}>📊</div>
            <style>{`@keyframes pulse { 0%,100%{opacity:0.5;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.05)} }`}</style>
            <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 18 }}>กำลังเปิดห้อง <span style={{ fontFamily: 'monospace', color: CI.cyan }}>{activeCode}</span>...</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>กรุณารอสักครู่</p>
          </div>
        )}
      </div>
    );
  }

  if (view === 'manage' && classData) {
    return <ManageView
      code={activeCode}
      classData={classData}
      onBack={() => { setView('list'); setActiveCode(''); setClassData(null); }}
      onAddStudent={addStudent}
      onRemoveStudent={removeStudent}
      onUpdateScore={updateScore}
      onRefresh={() => fetchClass(activeCode)}
      onImportRoster={importRoster}
      onImportScores={importScores}
    />;
  }

  // ════════════════════════════════════════════════════════════════════════
  // LIST VIEW (default)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>📊 ระบบบันทึกคะแนนเก็บ</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>โปร่งใส ตรวจสอบได้ — นักศึกษาเช็กความคืบหน้าได้เอง</p>
        </div>
        <button onClick={() => setView('create')} style={{
          padding: '12px 22px', borderRadius: 12, border: 'none',
          background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 15,
          boxShadow: `0 4px 16px ${CI.cyan}30`,
        }}>+ สร้างห้องเรียนใหม่</button>
      </div>

      {/* Quick join existing class by code */}
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>📥 เปิดห้องด้วย Code:</span>
        <input id="join-code" placeholder="C12345" maxLength={10} style={{ ...inp, width: 200, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 2 }} />
        <button onClick={() => {
          const v = document.getElementById('join-code').value.trim().toUpperCase();
          if (v) openClass(v);
        }} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: CI.cyan, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 700 }}>เปิด →</button>
      </div>

      {/* Saved classes */}
      {savedClasses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>ยังไม่มีห้องเรียน</h3>
          <p style={{ margin: 0, color: '#64748b' }}>กด "+ สร้างห้องเรียนใหม่" เพื่อเริ่ม</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {savedClasses.map(c => (
            <div key={c.code} onClick={() => openClass(c.code)} style={{
              background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e2e8f0',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${CI.cyan}25`; e.currentTarget.style.borderColor = CI.cyan; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <div style={{
                display: 'inline-block', background: `${CI.cyan}15`, color: CI.cyan,
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: 1,
                marginBottom: 8,
              }}>{c.code}</div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#0f172a' }}>{c.courseName}</h3>
              <div style={{ fontSize: 13, color: '#64748b' }}>{c.course} · กลุ่ม {c.section}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                สร้าง: {new Date(c.createdAt).toLocaleDateString('th-TH')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ManageView — show roster, gradebook, audit log
// ════════════════════════════════════════════════════════════════════════════
function ManageView({ code, classData, onBack, onAddStudent, onRemoveStudent, onUpdateScore, onRefresh, onImportRoster, onImportScores }) {
  const [tab, setTab] = useState('grades'); // grades | roster | audit | share
  const [newStu, setNewStu] = useState({ studentId: '', firstName: '', lastName: '' });
  const qrRef = useRef(null);
  const rosterFileRef = useRef(null);
  const scoresFileRef = useRef(null);

  const studentUrl = typeof window !== 'undefined' ? `${window.location.origin}/student/progress?code=${code}` : '';

  useEffect(() => {
    if (tab === 'share' && qrRef.current && studentUrl) {
      QRCode.toCanvas(qrRef.current, studentUrl, { width: 220, margin: 2 });
    }
  }, [tab, studentUrl]);

  const submittedCount = (compId) =>
    (classData.students || []).filter(s => s.checklist?.[compId]?.submitted).length;

  return (
    <div style={{ padding: 20, maxWidth: 1300, margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: FONT, color: '#64748b' }}>← กลับ</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: 1 }}>CODE: {code}</div>
          <h2 style={{ margin: '2px 0 0', fontSize: 22, color: '#0f172a' }}>{classData.courseName}</h2>
          <div style={{ fontSize: 13, color: '#64748b' }}>{classData.course} · กลุ่ม {classData.section} · {classData.teacher}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onRefresh} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: FONT, color: '#475569', fontSize: 13 }}>🔄 รีเฟรช</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 5, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { id: 'grades', icon: '📋', label: 'กรอกคะแนน' },
          { id: 'roster', icon: '👥', label: 'รายชื่อ' },
          { id: 'share',  icon: '📲', label: 'แชร์ให้นักศึกษา' },
          { id: 'audit',  icon: '🔍', label: 'ประวัติ (โปร่งใส)' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 9, border: 'none',
            background: tab === t.id ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : 'transparent',
            color: tab === t.id ? '#fff' : '#475569',
            cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14,
            boxShadow: tab === t.id ? `0 3px 10px ${CI.purple}30` : 'none',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* TAB: GRADES */}
      {tab === 'grades' && (
        <>
          {/* Bulk import scores bar */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '2px solid #fbbf24', borderRadius: 14,
            padding: '12px 18px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 280px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#78350f' }}>📥 นำเข้าคะแนนจาก Excel/CSV</div>
              <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5, marginTop: 2 }}>
                คอลัมน์: <code style={{ background:'#fff', padding:'1px 5px', borderRadius:3 }}>รหัส | ชื่อ | นามสกุล | คะแนนงาน1 | คะแนนงาน2 | ...</code>
                {' — '}AI จับคู่ชื่อชิ้นงานจากหัวคอลัมน์ ถ้าไม่ตรงจะเรียงตามลำดับ
              </div>
            </div>
            <input
              ref={scoresFileRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={async e => {
                const f = e.target.files?.[0];
                if (f) await onImportScores(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => {
                const components = classData?.components || [];
                const bonusItems = classData?.bonus || [];
                const headers = ['รหัสนักศึกษา', 'ชื่อ', 'นามสกุล',
                  ...components.map(c => c.name),
                  ...bonusItems.map(b => `(พิเศษ) ${b.name}`)];
                let csv = '﻿' + headers.join(',') + '\n';
                (classData?.students || []).forEach(s => {
                  const row = [s.studentId, s.firstName, s.lastName || ''];
                  components.forEach(c => row.push(s.scores?.[c.id] ?? ''));
                  bonusItems.forEach(b => row.push(s.bonus?.[b.id] ?? ''));
                  csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${code}_scores_template.csv`;
                a.click(); URL.revokeObjectURL(url);
              }}
              style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #fbbf24', background:'#fff', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:12, color:'#78350f' }}>
              ⬇️ Template (พร้อมรายชื่อ)
            </button>
            <button onClick={() => scoresFileRef.current?.click()} style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
              color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 14,
              boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
            }}>
              📂 อัปโหลดคะแนน
            </button>
          </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16, overflowX: 'auto' }}>
          {(classData.students || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              ยังไม่มีนักศึกษา — แชร์ Code <strong style={{ color: CI.cyan }}>{code}</strong> ให้นักศึกษาเข้าได้
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, minWidth: 200 }}>นักศึกษา</th>
                  {(classData.components || []).map(c => (
                    <th key={c.id} style={thStyle}>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                        {c.weight}% • เต็ม {c.maxScore}
                      </div>
                      <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
                        ส่งแล้ว {submittedCount(c.id)}/{(classData.students || []).length}
                      </div>
                    </th>
                  ))}
                  {(classData.bonus || []).map(b => (
                    <th key={b.id} style={{ ...thStyle, background: '#fef9c3' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e' }}>🎁 {b.name}</div>
                      <div style={{ fontSize: 10, color: '#a16207', fontWeight: 500 }}>+{b.maxScore} bonus</div>
                    </th>
                  ))}
                  <th style={{ ...thStyle, minWidth: 90 }}>รวม</th>
                </tr>
              </thead>
              <tbody>
                {(classData.students || []).map(stu => (
                  <StudentRow key={stu.studentId}
                    stu={stu}
                    components={classData.components || []}
                    bonus={classData.bonus || []}
                    onUpdateScore={onUpdateScore}
                    onRemove={() => onRemoveStudent(stu.studentId)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>
      )}

      {/* TAB: ROSTER */}
      {tab === 'roster' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Bulk import box ── */}
            <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5)', borderRadius: 14, border: '2px solid #93c5fd', padding: 18 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#0c4a6e' }}>📥 นำเข้ารายชื่อจากไฟล์</h3>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                ไฟล์ <strong>CSV / Excel (.xlsx)</strong> — คอลัมน์เรียงตามนี้:<br/>
                <code style={{ background:'#fff', padding:'2px 6px', borderRadius:4, color:'#1e40af', fontWeight:700 }}>รหัส | ชื่อ | นามสกุล</code>
              </p>
              <input
                ref={rosterFileRef}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (f) await onImportRoster(f);
                  e.target.value = '';
                }}
              />
              <button onClick={() => rosterFileRef.current?.click()} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 800, fontSize: 14,
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}>
                📂 เลือกไฟล์ (CSV / Excel)
              </button>
              <button
                onClick={() => {
                  // Download a CSV template
                  const csv = '﻿รหัสนักศึกษา,ชื่อ,นามสกุล\n65000001,สมชาย,ใจดี\n65000002,สมหญิง,ใจงาม';
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'template_roster.csv';
                  a.click(); URL.revokeObjectURL(url);
                }}
                style={{ marginTop:8, width:'100%', padding:'8px', borderRadius:8, border:'1px solid #93c5fd', background:'#fff', cursor:'pointer', fontFamily:FONT, fontWeight:700, fontSize:12, color:'#0c4a6e' }}>
                ⬇️ ดาวน์โหลด Template CSV
              </button>
            </div>

            {/* ── Manual add ── */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>+ เพิ่มทีละคน</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input placeholder="รหัสนักศึกษา *" value={newStu.studentId} onChange={e => setNewStu({...newStu, studentId: e.target.value})} style={inp} />
                <input placeholder="ชื่อ *" value={newStu.firstName} onChange={e => setNewStu({...newStu, firstName: e.target.value})} style={inp} />
                <input placeholder="นามสกุล" value={newStu.lastName} onChange={e => setNewStu({...newStu, lastName: e.target.value})} style={inp} />
                <button onClick={() => {
                  if (!newStu.studentId || !newStu.firstName) { toast.error('กรอกรหัสและชื่อ'); return; }
                  onAddStudent(newStu.studentId, newStu.firstName, newStu.lastName);
                  setNewStu({ studentId: '', firstName: '', lastName: '' });
                }} style={{ padding: '10px', borderRadius: 8, border: 'none', background: CI.cyan, color: '#fff', cursor: 'pointer', fontFamily: FONT, fontWeight: 700 }}>+ เพิ่ม</button>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: '#64748b', background: '#f0fdf4', borderLeft: '3px solid #22c55e', padding: '10px 12px', borderRadius: 6 }}>
                💡 หรือให้นักศึกษาสแกน QR ในแท็บ "แชร์" เพื่อเข้าร่วมเองได้
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>👥 รายชื่อ ({(classData.students || []).length} คน)</h3>
            {(classData.students || []).length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>ยังไม่มีนักศึกษา</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {classData.students.map(s => (
                  <div key={s.studentId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: s.selfEnrolled ? '#f0fdf4' : '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569', minWidth: 90 }}>{s.studentId}</span>
                    <span style={{ flex: 1, color: '#0f172a', fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                    {s.selfEnrolled && <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>เข้าเอง</span>}
                    <button onClick={() => onRemoveStudent(s.studentId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SHARE */}
      {tab === 'share' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>📲 แชร์ให้นักศึกษา</h3>
          <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>นักศึกษาสแกน QR หรือใช้ Code นี้เพื่อเข้าระบบเช็กคะแนนของตัวเอง</p>

          <div style={{ display: 'inline-block', padding: 16, background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <canvas ref={qrRef} />
          </div>

          <div style={{ background: `${CI.cyan}10`, border: `2px solid ${CI.cyan}`, borderRadius: 12, padding: '14px 28px', display: 'inline-block', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>รหัสห้อง</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: CI.cyan, letterSpacing: 6, fontFamily: 'monospace' }}>{code}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => { navigator.clipboard.writeText(studentUrl); toast.success('คัดลอกลิงก์แล้ว'); }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: FONT, fontSize: 13, color: '#475569' }}>
              🔗 คัดลอกลิงก์
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', maxWidth: 500, margin: '0 auto', lineHeight: 1.6, background: '#fef9c3', padding: '12px 16px', borderRadius: 8 }}>
            💡 นักศึกษาแค่กรอก <strong>รหัส + ชื่อ + นามสกุล</strong> ก็เข้าระบบได้ทันที — ไม่ต้องสมัครสมาชิก
          </div>
        </div>
      )}

      {/* TAB: AUDIT */}
      {tab === 'audit' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>🔍 ประวัติการแก้ไข ({(classData.auditLog || []).length} รายการ)</h3>
          <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13 }}>ทุกการเปลี่ยนแปลงคะแนน + การเช็กลิสต์ของนักศึกษา ถูกบันทึกไว้เพื่อความโปร่งใส</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 500, overflowY: 'auto' }}>
            {[...(classData.auditLog || [])].reverse().map((log, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8,
                background: log.type === 'update_score' ? '#eff6ff' : log.type === 'student_check' ? '#f0fdf4' : '#f8fafc',
                fontSize: 13, alignItems: 'flex-start',
              }}>
                <span style={{ minWidth: 130, fontSize: 11, color: '#94a3b8' }}>
                  {new Date(log.at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span style={{ minWidth: 80, fontSize: 11, fontWeight: 700, color: log.by === 'teacher' ? CI.purple : '#16a34a' }}>
                  {log.by === 'teacher' ? '👨‍🏫 อาจารย์' : `👨‍🎓 ${log.by}`}
                </span>
                <span style={{ flex: 1, color: '#0f172a' }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '10px 8px', textAlign: 'center',
  fontSize: 12, fontWeight: 700, color: '#475569',
  borderBottom: '1px solid #e2e8f0',
};

// Single student row with editable scores
function StudentRow({ stu, components, bonus, onUpdateScore, onRemove }) {
  // Calculate total
  let earned = 0, possible = 0;
  for (const c of components) {
    const sc = stu.scores?.[c.id];
    if (sc != null) {
      earned += (sc / (c.maxScore || 100)) * c.weight;
      possible += c.weight;
    }
  }
  const bonusTotal = Object.values(stu.bonus || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const finalScore = Math.round((earned + bonusTotal) * 10) / 10;

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ ...tdStyle, position: 'sticky', left: 0, background: '#fff', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{stu.firstName} {stu.lastName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{stu.studentId}</div>
          </div>
        </div>
      </td>
      {components.map(c => {
        const submitted = stu.checklist?.[c.id]?.submitted;
        return (
          <td key={c.id} style={tdStyle}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input
                type="number"
                min="0"
                max={c.maxScore}
                step="0.5"
                value={stu.scores?.[c.id] ?? ''}
                onChange={e => onUpdateScore(stu.studentId, c.id, e.target.value === '' ? null : Number(e.target.value), false)}
                placeholder="-"
                style={{
                  width: 60, padding: '6px', borderRadius: 6,
                  border: `2px solid ${submitted ? '#22c55e' : '#e2e8f0'}`,
                  background: submitted ? '#f0fdf4' : '#fff',
                  textAlign: 'center', fontFamily: FONT, fontSize: 13, outline: 'none',
                }} />
              {submitted && <span style={{ position: 'absolute', top: -6, right: -6, fontSize: 12, background: '#22c55e', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>✓</span>}
            </div>
          </td>
        );
      })}
      {bonus.map(b => (
        <td key={b.id} style={{ ...tdStyle, background: '#fffbeb' }}>
          <input
            type="number"
            min="0"
            max={b.maxScore}
            value={stu.bonus?.[b.id] ?? ''}
            onChange={e => onUpdateScore(stu.studentId, b.id, e.target.value === '' ? null : Number(e.target.value), true)}
            placeholder="-"
            style={{ width: 50, padding: '6px', borderRadius: 6, border: '2px solid #fbbf24', background: '#fffbeb', textAlign: 'center', fontFamily: FONT, fontSize: 13, outline: 'none' }} />
        </td>
      ))}
      <td style={{ ...tdStyle, fontWeight: 800, fontSize: 14, color: finalScore >= 50 ? '#16a34a' : '#dc2626' }}>
        {finalScore}
      </td>
    </tr>
  );
}

const tdStyle = {
  padding: '10px 8px', textAlign: 'center',
  borderBottom: '1px solid #f1f5f9',
};
