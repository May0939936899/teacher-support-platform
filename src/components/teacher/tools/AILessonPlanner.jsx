'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

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
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '380px 1fr' : '1fr', gap: '24px' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '22px', color: '#1e293b', fontWeight: 700 }}>📋 ข้อมูลแผนการสอน</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>หัวข้อการสอน *</label>
            <input value={form.topic} onChange={e => setForm(v => ({ ...v, topic: e.target.value }))} placeholder="เช่น การวิเคราะห์การตลาดเชิงกลยุทธ์" style={inp} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>รายวิชา</label>
            <input value={form.course} onChange={e => setForm(v => ({ ...v, course: e.target.value }))} placeholder="รหัส/ชื่อวิชา" style={inp} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>CLO (Course Learning Outcome) *</label>
            <textarea
              value={form.clo}
              onChange={e => setForm(v => ({ ...v, clo: e.target.value }))}
              placeholder="นักศึกษาสามารถวิเคราะห์และประยุกต์ใช้..."
              style={{ ...inp, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
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
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
          }}>
            {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างแผนการสอน TQF'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: 700 }}>📄 แผนการสอน</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success('คัดลอกแล้ว'); }} style={actBtn}>📋 คัดลอก</button>
                <DownloadDropdown
                  options={[
                    { label: 'Text', icon: '📝', ext: 'TXT', color: '#64748b', onClick: () => {
                      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                      a.download = `lesson_plan_${form.topic}.txt`; a.click(); toast.success('ดาวน์โหลด TXT แล้ว');
                    }},
                    { label: 'PDF', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: async () => {
                      const { buildTextHTML, downloadHTMLAsPDF } = await import('@/lib/teacher/exportUtils');
                      const html = buildTextHTML(`แผนการสอน: ${form.topic}`, result);
                      await downloadHTMLAsPDF(html, `lesson_plan_${form.topic}`);
                      toast.success('ดาวน์โหลด PDF แล้ว');
                    }},
                  ]}
                />
              </div>
            </div>
            <div style={{
              background: '#f8fafc', borderRadius: '12px', padding: '24px',
              minHeight: '500px', fontSize: '16px', lineHeight: 1.9,
              color: '#1e293b', whiteSpace: 'pre-wrap', fontFamily: FONT, overflowY: 'auto',
            }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actBtn = { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 };
