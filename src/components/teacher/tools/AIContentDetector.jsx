'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function AIContentDetector() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    if (!text.trim() || text.length < 100) {
      toast.error('กรุณากรอกข้อความอย่างน้อย 100 ตัวอักษร');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'ai_detector', payload: { text } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      const jsonMatch = data.result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('รูปแบบผลลัพธ์ไม่ถูกต้อง');
      const parsed = JSON.parse(jsonMatch[0]);
      setResult(parsed);
      toast.success('วิเคราะห์แล้ว!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getAIColor = (prob) => {
    if (prob < 30) return '#16a34a';
    if (prob < 60) return '#ca8a04';
    if (prob < 80) return '#ea580c';
    return '#dc2626';
  };

  const getVerdictStyle = (verdict) => {
    if (!verdict) return { bg: '#f1f5f9', text: '#64748b' };
    if (verdict.includes('มนุษย์')) return { bg: '#dcfce7', text: '#16a34a' };
    if (verdict.includes('อาจ')) return { bg: '#fef3c7', text: '#92400e' };
    if (verdict.includes('น่าจะ')) return { bg: '#ffedd5', text: '#c2410c' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Input */}
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
              📄 ข้อความที่ต้องการตรวจ
            </label>
            <textarea
              placeholder="วางข้อความที่ต้องการตรวจว่าเขียนโดย AI หรือมนุษย์ (อย่างน้อย 100 ตัวอักษร)..."
              value={text}
              onChange={e => setText(e.target.value)}
              style={{
                width: '100%', minHeight: '300px', padding: '12px', borderRadius: '10px',
                border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.7,
                resize: 'vertical', fontFamily: 'inherit', color: '#1e293b',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{text.length} ตัวอักษร (ขั้นต่ำ 100)</span>
              {text.length > 0 && (
                <button onClick={() => setText('')} style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ล้าง
                </button>
              )}
            </div>
          </div>
          <button
            onClick={detect}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              background: loading ? '#94a3b8' : '#7c3aed', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? '⏳ กำลังวิเคราะห์...' : '🤖 ตรวจสอบ AI Content'}
          </button>

          {/* Info */}
          <div style={{ background: '#faf5ff', borderRadius: '12px', padding: '14px', border: '1px solid #e9d5ff', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', marginBottom: '8px' }}>📌 เกี่ยวกับ AI Detector</div>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#6b21a8', fontSize: '12px' }}>
              <li style={{ marginBottom: '4px' }}>วิเคราะห์รูปแบบภาษา โครงสร้างประโยค และ pattern ที่ AI มักใช้</li>
              <li style={{ marginBottom: '4px' }}>ผลลัพธ์เป็นการประมาณการ ไม่ใช่การตัดสินชี้ขาด</li>
              <li>ข้อความยาวขึ้น = ผลแม่นยำขึ้น (แนะนำ 300+ ตัวอักษร)</li>
            </ul>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main verdict */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>ผลการวิเคราะห์</div>

              {/* Dual meter */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>👤 มนุษย์ {result.human_probability}%</span>
                  <span style={{ color: getAIColor(result.ai_probability), fontWeight: 700 }}>🤖 AI {result.ai_probability}%</span>
                </div>
                <div style={{ height: '20px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${result.human_probability}%`, background: '#16a34a', transition: 'width 0.5s' }} />
                  <div style={{ width: `${result.ai_probability}%`, background: getAIColor(result.ai_probability), transition: 'width 0.5s' }} />
                </div>
              </div>

              <div style={{
                display: 'inline-block', padding: '8px 20px', borderRadius: '20px',
                ...getVerdictStyle(result.verdict),
                fontWeight: 700, fontSize: '15px',
              }}>
                {result.verdict}
              </div>
            </div>

            {/* Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>🤖 สัญญาณ AI</div>
                {(result.indicators?.ai_indicators || []).map((ind, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#374151', padding: '4px 0', borderBottom: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                    • {ind}
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>👤 สัญญาณมนุษย์</div>
                {(result.indicators?.human_indicators || []).map((ind, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#374151', padding: '4px 0', borderBottom: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                    • {ind}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>📋 การวิเคราะห์</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{result.analysis}</p>
            </div>

            {/* Suspicious segments */}
            {result.suspicious_segments && result.suspicious_segments.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  ⚠️ ส่วนที่น่าสงสัย ({result.suspicious_segments.length})
                </div>
                {result.suspicious_segments.map((seg, i) => (
                  <div key={i} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #fecaca' }}>
                    <div style={{ background: '#fee2e2', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>AI Score: {seg.score}%</span>
                      <span style={{ color: '#7f1d1d' }}>{seg.reason}</span>
                    </div>
                    <div style={{ padding: '10px 12px', background: '#fffbfb' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{seg.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
