'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AILessonPlanner() {
  const [form, setForm] = useState({ topic: '', clo: '', duration: '90', level: 'ปริญญาตรี', course: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.topic || !form.clo) { toast.error('กรุณากรอกหัวข้อและ CLO'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'lesson_planner', payload: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
      toast.success('สร้างแผนการสอนแล้ว!');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '360px 1fr' : '1fr', gap: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>📋 ข้อมูลแผนการสอน</h3>
          {[
            { key: 'topic', label: 'หัวข้อการสอน *', placeholder: 'เช่น การวิเคราะห์การตลาดเชิงกลยุทธ์' },
            { key: 'course', label: 'รายวิชา', placeholder: 'รหัส/ชื่อวิชา' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '12px' }}>
              <label style={lbl}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inp} />
            </div>
          ))}
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>CLO (Course Learning Outcome) *</label>
            <textarea
              value={form.clo}
              onChange={e => setForm(v => ({ ...v, clo: e.target.value }))}
              placeholder="นักศึกษาสามารถวิเคราะห์และประยุกต์ใช้..."
              style={{ ...inp, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>ระยะเวลา (นาที)</label>
              <select value={form.duration} onChange={e => setForm(v => ({ ...v, duration: e.target.value }))} style={inp}>
                {['50', '60', '90', '120', '150', '180'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>ระดับ</label>
              <select value={form.level} onChange={e => setForm(v => ({ ...v, level: e.target.value }))} style={inp}>
                {['ปริญญาตรีปี 1', 'ปริญญาตรีปี 2', 'ปริญญาตรีปี 3', 'ปริญญาตรีปี 4', 'ปริญญาโท'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button onClick={generate} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: loading ? '#94a3b8' : '#0d9488', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '14px', fontFamily: 'inherit',
          }}>
            {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างแผนการสอน TQF'}
          </button>
        </div>

        {result && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>📄 แผนการสอน</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success('คัดลอกแล้ว'); }}
                  style={actBtn}>📋 คัดลอก</button>
                <button onClick={() => {
                  const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                  a.download = `lesson_plan_${form.topic}.txt`; a.click(); toast.success('ดาวน์โหลดแล้ว');
                }} style={{ ...actBtn, background: '#0d9488', color: '#fff', border: 'none' }}>⬇️ Download</button>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', minHeight: '500px', fontSize: '13px', lineHeight: 1.8, color: '#1e293b', whiteSpace: 'pre-wrap', fontFamily: "'Noto Sans Thai', sans-serif", overflowY: 'auto' }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const lbl = { fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' };
const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actBtn = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' };
