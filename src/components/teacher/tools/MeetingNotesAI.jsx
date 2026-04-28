'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

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
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Input */}
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '22px', color: '#1e293b', fontWeight: 700 }}>🗒️ บันทึกการประชุม</h3>
            <textarea
              placeholder="วางหรือพิมพ์บันทึกการประชุมที่นี่... AI จะสรุปให้อัตโนมัติ&#10;&#10;ตัวอย่าง:&#10;- ประชุมคณะกรรมการหลักสูตร ครั้งที่ 3/2569&#10;- ผู้เข้าร่วม: อ.สมชาย, อ.สมหญิง&#10;- วาระที่ 1: รายงานผลการดำเนินงาน..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%', minHeight: '350px', padding: '16px', borderRadius: '12px',
                border: '1px solid #e2e8f0', fontSize: '16px', lineHeight: 1.8,
                resize: 'vertical', fontFamily: 'inherit', color: '#1e293b',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>{notes.length} ตัวอักษร</span>
              {notes.length < 50 && notes.length > 0 && (
                <span style={{ fontSize: '14px', color: CI.magenta }}>ต้องมีอย่างน้อย 50 ตัวอักษร</span>
              )}
            </div>
            <button onClick={summarize} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
            }}>
              {loading ? '⏳ กำลังสรุป...' : '✨ สรุปการประชุม AI'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Summary */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>📋 สรุปการประชุม</div>
              <p style={{ margin: 0, fontSize: '16px', color: '#374151', lineHeight: 1.8 }}>{result.meeting_summary}</p>
            </div>

            {/* Key decisions */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>✅ มติที่ประชุม</div>
              {(result.key_decisions || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '16px', color: '#374151' }}>
                  <span style={{ color: CI.cyan, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>

            {/* Action items */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: `1px solid ${CI.cyan}30` }}>
              <div style={{ fontSize: '17px', fontWeight: 700, color: CI.cyan, marginBottom: '12px' }}>🎯 Action Items</div>
              {(result.action_items || []).map((a, i) => (
                <div key={i} style={{ background: `${CI.cyan}08`, borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{a.task}</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>👤 {a.responsible}</span>
                    <span>📅 {a.deadline}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Next meeting */}
            {result.next_meeting && (
              <div style={{ background: `${CI.purple}10`, borderRadius: '12px', padding: '16px', border: `1px solid ${CI.purple}25`, fontSize: '16px', color: CI.purple, fontWeight: 600 }}>
                📅 นัดครั้งถัดไป: {result.next_meeting}
              </div>
            )}

            {/* Copy all */}
            <button onClick={() => {
              const text = `สรุปการประชุม\n${'='.repeat(40)}\n\nสรุป: ${result.meeting_summary}\n\nมติ:\n${result.key_decisions?.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nAction Items:\n${result.action_items?.map(a => `- ${a.task} (${a.responsible}) ภายใน: ${a.deadline}`).join('\n')}${result.next_meeting ? `\n\nนัดครั้งถัดไป: ${result.next_meeting}` : ''}`;
              navigator.clipboard.writeText(text); toast.success('คัดลอกทั้งหมดแล้ว');
            }} style={{
              padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '16px',
              fontFamily: 'inherit', fontWeight: 600,
            }}>
              📋 คัดลอกทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
