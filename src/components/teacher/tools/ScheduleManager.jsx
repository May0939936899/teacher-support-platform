'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const COLORS = ['#00b4e6', '#e6007e', '#7c4dff', '#ffc107', '#4caf50', '#ff5722', '#009688', '#e91e63', '#3f51b5', '#795548'];
const STORAGE_KEY = 'schedule-manager-classes';

export default function ScheduleManager() {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', room: '', day: 'mon', startHour: 8, startMin: 0, endHour: 9, endMin: 0, color: COLORS[0] });

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setClasses(JSON.parse(s)); } catch {}
  }, []);

  const save = (c) => { setClasses(c); localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); };
  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const openAdd = (dayKey, hour) => {
    setEditId(null);
    setForm({ name: '', room: '', day: dayKey || 'mon', startHour: hour || 8, startMin: 0, endHour: (hour || 8) + 1, endMin: 0, color: COLORS[classes.length % COLORS.length] });
    setShowForm(true);
  };

  const openEdit = (cls) => {
    setEditId(cls.id);
    setForm({ name: cls.name, room: cls.room, day: cls.day, startHour: cls.startHour, startMin: cls.startMin, endHour: cls.endHour, endMin: cls.endMin, color: cls.color });
    setShowForm(true);
  };

  const saveClass = () => {
    if (!form.name.trim()) { toast.error('กรุณาระบุชื่อวิชา'); return; }
    const startT = form.startHour * 60 + Number(form.startMin);
    const endT = form.endHour * 60 + Number(form.endMin);
    if (endT <= startT) { toast.error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'); return; }
    if (editId) {
      save(classes.map(c => c.id === editId ? { ...c, ...form } : c));
      toast.success('แก้ไขแล้ว');
    } else {
      save([...classes, { ...form, id: Date.now() }]);
      toast.success('เพิ่มคลาสแล้ว');
    }
    setShowForm(false); setEditId(null);
  };

  const deleteClass = (id) => { save(classes.filter(c => c.id !== id)); toast.success('ลบแล้ว'); setShowForm(false); };

  const isStartSlot = (dayKey, hour) => classes.find(c => c.day === dayKey && c.startHour === hour);
  const getClassesForSlot = (dayKey, hour) => classes.filter(c => c.day === dayKey && c.startHour <= hour && (c.endHour > hour || (c.endHour === hour && c.endMin > 0)));
  const getSpan = (cls) => { const s = cls.startHour + cls.startMin / 60; const e = cls.endHour + cls.endMin / 60; return Math.ceil(e - s); };

  const exportAsText = () => {
    const lines = ['═══ ตารางสอน ═══', ''];
    DAY_KEYS.forEach((dk, i) => {
      const dayClasses = classes.filter(c => c.day === dk).sort((a, b) => a.startHour - b.startHour);
      if (dayClasses.length > 0) {
        lines.push(`📅 วัน${DAYS[i]}`);
        dayClasses.forEach(c => {
          lines.push(`  ${String(c.startHour).padStart(2, '0')}:${String(c.startMin).padStart(2, '0')}-${String(c.endHour).padStart(2, '0')}:${String(c.endMin).padStart(2, '0')} | ${c.name} | ห้อง ${c.room}`);
        });
        lines.push('');
      }
    });
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('คัดลอกตารางแล้ว');
  };

  const exportAsImage = () => {
    const canvas = document.createElement('canvas');
    const colW = 160, rowH = 50, headerH = 40, timeW = 70;
    canvas.width = timeW + colW * 5 + 20;
    canvas.height = headerH + rowH * 11 + 20;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    DAYS.forEach((d, i) => {
      ctx.fillStyle = CI.cyan;
      ctx.fillRect(timeW + i * colW, 0, colW - 1, headerH);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 14px sans-serif`;
      ctx.fillText(d, timeW + i * colW + 10, 26);
    });

    HOURS.forEach((h, i) => {
      ctx.fillStyle = CI.dark;
      ctx.font = `12px sans-serif`;
      ctx.fillText(`${String(h).padStart(2, '0')}:00`, 5, headerH + i * rowH + 28);
      ctx.strokeStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(timeW, headerH + i * rowH);
      ctx.lineTo(canvas.width, headerH + i * rowH);
      ctx.stroke();
    });

    classes.forEach(c => {
      const di = DAY_KEYS.indexOf(c.day);
      const startY = headerH + (c.startHour - 8) * rowH + (c.startMin / 60) * rowH;
      const endY = headerH + (c.endHour - 8) * rowH + (c.endMin / 60) * rowH;
      const h = endY - startY;
      ctx.fillStyle = c.color + 'dd';
      ctx.beginPath();
      ctx.roundRect(timeW + di * colW + 2, startY + 1, colW - 5, h - 2, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 12px sans-serif`;
      ctx.fillText(c.name, timeW + di * colW + 8, startY + 18);
      ctx.font = `10px sans-serif`;
      ctx.fillText(c.room, timeW + di * colW + 8, startY + 32);
    });

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `schedule-${Date.now()}.png`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลดรูปตารางแล้ว');
    });
  };

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, fontWeight: 600,
  });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

  const rendered = {};

  return (
    <div style={{ fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>📅 ตารางสอน Week View</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>จัดการตารางสอนรายสัปดาห์ คลิกช่องเพื่อเพิ่มคลาส</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={btnStyle()} onClick={() => openAdd()}>➕ เพิ่มคลาส</button>
        <button style={btnStyle(CI.purple)} onClick={exportAsText}>📋 คัดลอกข้อความ</button>
        <button style={btnStyle(`linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`)} onClick={exportAsImage}>🖼️ ดาวน์โหลดรูป</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ ...cardStyle, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 18, color: CI.dark, marginTop: 0 }}>{editId ? 'แก้ไขคลาส' : 'เพิ่มคลาสใหม่'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input style={inputStyle} placeholder="ชื่อวิชา" value={form.name} onChange={e => updateField('name', e.target.value)} />
              <input style={inputStyle} placeholder="ห้องเรียน" value={form.room} onChange={e => updateField('room', e.target.value)} />
              <select style={inputStyle} value={form.day} onChange={e => updateField('day', e.target.value)}>
                {DAY_KEYS.map((k, i) => <option key={k} value={k}>{DAYS[i]}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#888' }}>เริ่ม</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select style={{ ...inputStyle, width: 'auto' }} value={form.startHour} onChange={e => updateField('startHour', Number(e.target.value))}>
                      {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                    </select>
                    <select style={{ ...inputStyle, width: 'auto' }} value={form.startMin} onChange={e => updateField('startMin', Number(e.target.value))}>
                      {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#888' }}>สิ้นสุด</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select style={{ ...inputStyle, width: 'auto' }} value={form.endHour} onChange={e => updateField('endHour', Number(e.target.value))}>
                      {[...HOURS, 18].map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                    </select>
                    <select style={{ ...inputStyle, width: 'auto' }} value={form.endMin} onChange={e => updateField('endMin', Number(e.target.value))}>
                      {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#888' }}>สี</label>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => updateField('color', c)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer', border: form.color === c ? '3px solid #333' : '3px solid transparent' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button style={{ ...btnStyle(), flex: 1 }} onClick={saveClass}>{editId ? '💾 บันทึก' : '➕ เพิ่ม'}</button>
                {editId && <button style={{ ...btnStyle('#e53935') }} onClick={() => deleteClass(editId)}>🗑️ ลบ</button>}
                <button style={{ ...btnStyle('#888') }} onClick={() => setShowForm(false)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 70, padding: 10, background: CI.dark, color: '#fff', fontSize: 14, borderRadius: '10px 0 0 0' }}>เวลา</th>
              {DAYS.map((d, i) => (
                <th key={d} style={{ padding: 10, background: CI.dark, color: '#fff', fontSize: 14, borderRadius: i === 4 ? '0 10px 0 0' : 0 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td style={{ padding: '6px 8px', fontSize: 13, color: '#888', borderBottom: '1px solid #f0f0f0', textAlign: 'center', fontWeight: 600 }}>
                  {String(hour).padStart(2, '0')}:00
                </td>
                {DAY_KEYS.map(dk => {
                  const key = `${dk}-${hour}`;
                  if (rendered[key]) return null;
                  const cls = isStartSlot(dk, hour);
                  if (cls) {
                    const span = getSpan(cls);
                    for (let s = 0; s < span; s++) rendered[`${dk}-${hour + s}`] = true;
                    return (
                      <td key={dk} rowSpan={span} style={{ padding: 2, borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                        <div onClick={() => openEdit(cls)}
                          style={{ background: cls.color, color: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', height: '100%', minHeight: span * 40 - 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{cls.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.9 }}>🏫 {cls.room}</div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>
                            {String(cls.startHour).padStart(2, '0')}:{String(cls.startMin).padStart(2, '0')}-{String(cls.endHour).padStart(2, '0')}:{String(cls.endMin).padStart(2, '0')}
                          </div>
                        </div>
                      </td>
                    );
                  }
                  const occupied = getClassesForSlot(dk, hour);
                  if (occupied.length > 0) return null;
                  return (
                    <td key={dk} onClick={() => openAdd(dk, hour)}
                      style={{ padding: 2, borderBottom: '1px solid #f0f0f0', cursor: 'pointer', minHeight: 40 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f8ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
