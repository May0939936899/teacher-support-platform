'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AILetterWriter() {
  const [form, setForm] = useState({
    subject: '',
    recipient: '',
    recipientOrg: '',
    purpose: '',
    details: '',
    sender: '',
    senderOrg: '',
    date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedResult, setEditedResult] = useState('');

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.subject || !form.recipient || !form.purpose) {
      toast.error('กรุณากรอก เรื่อง ผู้รับ และจุดประสงค์');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'letter_writer', payload: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
      setResult(data.result);
      setEditedResult(data.result);
      toast.success('สร้างจดหมายแล้ว!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editMode ? editedResult : result);
    toast.success('คัดลอกแล้ว!');
  };

  const downloadTxt = () => {
    const text = editMode ? editedResult : result;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `จดหมาย_${form.subject || 'ราชการ'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดแล้ว');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '400px 1fr' : '1fr', gap: '24px' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', color: '#1e293b' }}>✉️ ข้อมูลจดหมาย</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="เรื่อง *">
              <input placeholder="เรื่อง: ขอความอนุเคราะห์..." value={form.subject} onChange={e => update('subject', e.target.value)} style={inp} />
            </Field>
            <Field label="เรียน / ผู้รับ *">
              <input placeholder="เช่น คณบดีคณะบริหารธุรกิจ" value={form.recipient} onChange={e => update('recipient', e.target.value)} style={inp} />
            </Field>
            <Field label="หน่วยงานผู้รับ">
              <input placeholder="เช่น มหาวิทยาลัยศรีปทุม" value={form.recipientOrg} onChange={e => update('recipientOrg', e.target.value)} style={inp} />
            </Field>
            <Field label="จุดประสงค์ *">
              <textarea
                placeholder="ระบุจุดประสงค์หลักของจดหมาย เช่น ขอความอนุเคราะห์เป็นวิทยากร..."
                value={form.purpose}
                onChange={e => update('purpose', e.target.value)}
                style={{ ...inp, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
            <Field label="รายละเอียดเพิ่มเติม">
              <textarea
                placeholder="วันที่/เวลา สถานที่ หัวข้อ ข้อมูลอื่นๆ ที่เกี่ยวข้อง..."
                value={form.details}
                onChange={e => update('details', e.target.value)}
                style={{ ...inp, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="ผู้ส่ง / ตำแหน่ง">
                <input placeholder="ชื่อ / ตำแหน่ง" value={form.sender} onChange={e => update('sender', e.target.value)} style={inp} />
              </Field>
              <Field label="หน่วยงานผู้ส่ง">
                <input placeholder="คณะ / หน่วยงาน" value={form.senderOrg} onChange={e => update('senderOrg', e.target.value)} style={inp} />
              </Field>
            </div>
            <Field label="วันที่">
              <input value={form.date} onChange={e => update('date', e.target.value)} style={inp} />
            </Field>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                padding: '12px', borderRadius: '10px', border: 'none',
                background: loading ? '#94a3b8' : '#2563eb', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '⏳ กำลังสร้าง...' : '✨ สร้างจดหมาย AI'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', flex: 1 }}>📄 จดหมายที่สร้าง</h3>
              <button
                onClick={() => setEditMode(!editMode)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: editMode ? '#dbeafe' : '#f1f5f9', color: editMode ? '#1d4ed8' : '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
              >
                {editMode ? '✓ ดูตัวอย่าง' : '✏️ แก้ไข'}
              </button>
              <button onClick={copyToClipboard} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                📋 คัดลอก
              </button>
              <button onClick={downloadTxt} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                ⬇️ ดาวน์โหลด
              </button>
            </div>

            {editMode ? (
              <textarea
                value={editedResult}
                onChange={e => setEditedResult(e.target.value)}
                style={{
                  width: '100%', minHeight: '500px', padding: '16px', borderRadius: '10px',
                  border: '1px solid #bfdbfe', fontSize: '13px', lineHeight: 1.8,
                  fontFamily: "'Noto Sans Thai', serif", color: '#1e293b',
                  background: '#fffff8', boxSizing: 'border-box', resize: 'vertical',
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{
                background: '#fffff8', borderRadius: '10px', padding: '24px',
                border: '1px solid #e2e8f0', minHeight: '500px',
                fontFamily: "'Noto Sans Thai', 'Sarabun', serif",
                fontSize: '14px', lineHeight: 2, color: '#1e293b',
                whiteSpace: 'pre-wrap',
              }}>
                {result}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Templates */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b' }}>⚡ เทมเพลตด่วน</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'ขอวิทยากร', subject: 'ขอความอนุเคราะห์เป็นวิทยากร', purpose: 'ขอความอนุเคราะห์ท่านเป็นวิทยากรบรรยายให้ความรู้แก่นักศึกษา' },
            { label: 'ขอใช้สถานที่', subject: 'ขอใช้สถานที่จัดกิจกรรม', purpose: 'ขอความอนุเคราะห์ใช้สถานที่จัดกิจกรรมทางการศึกษา' },
            { label: 'ขอข้อมูล', subject: 'ขอข้อมูลเพื่อการวิจัย', purpose: 'ขอความอนุเคราะห์ข้อมูลเพื่อประกอบการวิจัย' },
            { label: 'ขอความร่วมมือ', subject: 'ขอความร่วมมือ MOU', purpose: 'ขอความร่วมมือในการจัดทำบันทึกข้อตกลงความร่วมมือ' },
          ].map(t => (
            <button
              key={t.label}
              onClick={() => setForm(f => ({ ...f, subject: t.subject, purpose: t.purpose }))}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid #bfdbfe',
                background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1e293b',
  fontFamily: 'inherit',
};
