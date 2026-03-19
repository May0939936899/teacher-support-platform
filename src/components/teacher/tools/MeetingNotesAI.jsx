'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function MeetingNotesAI() {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const summarize = async () => {
    if (!notes.trim() || notes.length < 50) { toast.error('กรุณากรอกบันทึกการประชุมอย่างน้อย 50 ตัวอักษร'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'meeting_notes', payload: { notes } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const json = data.result.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('รูปแบบผลลัพธ์ไม่ถูกต้อง');
      setResult(JSON.parse(json));
      toast.success('สรุปการประชุมแล้ว!');
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#1e293b' }}>🗒️ บันทึกการประชุม</h3>
            <textarea
              placeholder="วางหรือพิมพ์บันทึกการประชุมที่นี่... AI จะสรุปให้อัตโนมัติ"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', minHeight: '300px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginBottom: '14px' }}>{notes.length} ตัวอักษร</div>
            <button onClick={summarize} disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              background: loading ? '#94a3b8' : '#ef4444', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: 'inherit',
            }}>
              {loading ? '⏳ กำลังสรุป...' : '✨ สรุปการประชุม AI'}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>📋 สรุปการประชุม</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{result.meeting_summary}</p>
            </div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>✅ มติที่ประชุม</div>
              {(result.key_decisions || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#374151' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>{i + 1}.</span> {d}
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid #dcfce7' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginBottom: '10px' }}>🎯 Action Items</div>
              {(result.action_items || []).map((a, i) => (
                <div key={i} style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{a.task}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    👤 {a.responsible} | 📅 {a.deadline}
                  </div>
                </div>
              ))}
            </div>
            {result.next_meeting && (
              <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '14px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1d4ed8' }}>
                📅 <b>นัดครั้งถัดไป:</b> {result.next_meeting}
              </div>
            )}
            <button onClick={() => {
              const text = `สรุปการประชุม\n${'='.repeat(40)}\n\nสรุป: ${result.meeting_summary}\n\nมติ:\n${result.key_decisions?.map((d,i)=>`${i+1}. ${d}`).join('\n')}\n\nAction Items:\n${result.action_items?.map(a=>`- ${a.task} (${a.responsible}) ภายใน: ${a.deadline}`).join('\n')}`;
              navigator.clipboard.writeText(text); toast.success('คัดลอกแล้ว');
            }} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
              📋 คัดลอกทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
