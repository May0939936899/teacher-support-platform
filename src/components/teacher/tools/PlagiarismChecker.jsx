'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PlagiarismChecker() {
  const [original, setOriginal] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (!original.trim() || !submitted.trim()) {
      toast.error('กรุณากรอกทั้งข้อความต้นฉบับและข้อความที่ต้องการตรวจ');
      return;
    }
    if (original.length < 50 || submitted.length < 50) {
      toast.error('กรุณากรอกข้อความอย่างน้อย 50 ตัวอักษร');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'plagiarism_check', payload: { original, submitted } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      // Parse JSON from AI response
      const text = data.result;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('รูปแบบผลลัพธ์ไม่ถูกต้อง');
      const parsed = JSON.parse(jsonMatch[0]);
      setResult(parsed);
      toast.success('ตรวจสอบแล้ว!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    if (!verdict) return { bg: '#f1f5f9', text: '#64748b' };
    if (verdict.includes('ผ่าน')) return { bg: '#dcfce7', text: '#16a34a' };
    if (verdict.includes('ตรวจสอบ')) return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#fee2e2', text: '#dc2626' };
  };

  const getScoreColor = (score) => {
    if (score < 20) return '#16a34a';
    if (score < 40) return '#ca8a04';
    if (score < 60) return '#ea580c';
    return '#dc2626';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Original */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>ต้นฉบับ</span>
            ข้อความอ้างอิง
          </label>
          <textarea
            placeholder="วางข้อความต้นฉบับหรือแหล่งอ้างอิงที่นี่..."
            value={original}
            onChange={e => setOriginal(e.target.value)}
            style={taStyle}
          />
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{original.length} ตัวอักษร</div>
        </div>

        {/* Submitted */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>ส่งตรวจ</span>
            งานนักศึกษา
          </label>
          <textarea
            placeholder="วางงานที่ต้องการตรวจสอบที่นี่..."
            value={submitted}
            onChange={e => setSubmitted(e.target.value)}
            style={taStyle}
          />
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{submitted.length} ตัวอักษร</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          onClick={check}
          disabled={loading}
          style={{
            padding: '12px 40px', borderRadius: '10px', border: 'none',
            background: loading ? '#94a3b8' : '#2563eb', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px',
            fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}
        >
          {loading ? '⏳ กำลังตรวจสอบ...' : '🔍 ตรวจสอบ Similarity'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div>
          {/* Score overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'start' }}>
            {/* Score gauge */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '160px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Similarity Score</div>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 12px',
                background: `conic-gradient(${getScoreColor(result.similarity_score)} ${result.similarity_score}%, #f1f5f9 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '75px', height: '75px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: getScoreColor(result.similarity_score) }}>
                    {result.similarity_score}%
                  </span>
                </div>
              </div>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
                ...getVerdictColor(result.verdict),
                fontWeight: 700, fontSize: '13px',
              }}>
                {result.verdict}
              </div>
            </div>

            {/* Analysis */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#1e293b' }}>📋 การวิเคราะห์</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{result.analysis}</p>
            </div>

            {/* Recommendations */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#1e293b' }}>💡 คำแนะนำ</h4>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {(result.recommendations || []).map((r, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '6px', lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Similar segments */}
          {result.similar_segments && result.similar_segments.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#1e293b' }}>🔎 ส่วนที่คล้ายกัน ({result.similar_segments.length} ส่วน)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.similar_segments.map((seg, i) => (
                  <div key={i} style={{ borderRadius: '10px', border: '1px solid #fecaca', overflow: 'hidden' }}>
                    <div style={{ background: '#fee2e2', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>ส่วนที่ {i + 1}</span>
                      <span style={{ fontSize: '12px', background: '#dc2626', color: '#fff', borderRadius: '6px', padding: '1px 8px' }}>
                        {seg.similarity}% คล้ายกัน
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                      <div style={{ padding: '12px', borderRight: '1px solid #fee2e2', background: '#fff' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>ต้นฉบับ</div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6, background: '#fef2f2', padding: '8px', borderRadius: '6px' }}>
                          "{seg.original}"
                        </p>
                      </div>
                      <div style={{ padding: '12px', background: '#fff' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}>งานนักศึกษา</div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6, background: '#fef2f2', padding: '8px', borderRadius: '6px' }}>
                          "{seg.submitted}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info banner */}
      <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '14px 18px', border: '1px solid #bfdbfe', marginTop: '20px', fontSize: '13px', color: '#1d4ed8' }}>
        ℹ️ เกณฑ์: &lt;20% = ปกติ | 20-40% = ตรวจสอบเพิ่มเติม | &gt;40% = อาจมีการคัดลอก | ระบบใช้ AI วิเคราะห์ ควรใช้เป็นข้อมูลประกอบการพิจารณา
      </div>
    </div>
  );
}

const taStyle = {
  width: '100%', minHeight: '200px', padding: '12px', borderRadius: '10px',
  border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.7, resize: 'vertical',
  fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', outline: 'none',
};
