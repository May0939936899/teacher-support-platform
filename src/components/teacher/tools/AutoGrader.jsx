'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LS_KEY = 'teacher_auto_grader';

export default function AutoGrader() {
  const [rubric, setRubric] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.rubric) setRubric(p.rubric);
        if (p.studentWork) setStudentWork(p.studentWork);
        if (p.maxScore) setMaxScore(p.maxScore);
        if (p.result) setResult(p.result);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ rubric, studentWork, maxScore, result }));
    } catch {}
  }, [rubric, studentWork, maxScore, result]);

  const grade = async () => {
    if (!rubric.trim()) { toast.error('กรุณากรอกเกณฑ์การให้คะแนน (Rubric)'); return; }
    if (!studentWork.trim()) { toast.error('กรุณากรอกงานนักศึกษา'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'auto_grader', payload: { rubric, studentWork, maxScore } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseResult(data.result || '');
      setResult(parsed);
      toast.success('ให้คะแนนเสร็จแล้ว!');
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const parseResult = (text) => {
    const r = {
      breakdown: [],
      totalScore: 0,
      totalMax: maxScore,
      strengths: [],
      weaknesses: [],
      suggestions: [],
      raw: text,
    };

    // Parse score breakdown
    const breakdownMatch = text.match(/(?:คะแนน|score|breakdown|เกณฑ์|รายละเอียด)[:\s]*\n?([\s\S]*?)(?=(?:จุดแข็ง|strength|จุดเด่น|ข้อดี)|$)/i);
    if (breakdownMatch) {
      const lines = breakdownMatch[1].split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const scoreMatch = line.match(/(.+?)[:\-–]\s*(\d+)\s*\/\s*(\d+)\s*[:\-–]?\s*(.*)/);
        if (scoreMatch) {
          r.breakdown.push({
            criterion: scoreMatch[1].replace(/^[\s\-*•\d.)+]+/, '').trim(),
            score: parseInt(scoreMatch[2]),
            max: parseInt(scoreMatch[3]),
            comment: scoreMatch[4].trim(),
          });
        }
      });
    }

    // Parse total
    const totalMatch = text.match(/(?:รวม|total|คะแนนรวม)[:\s]*(\d+)\s*(?:\/\s*(\d+))?/i);
    if (totalMatch) {
      r.totalScore = parseInt(totalMatch[1]);
      if (totalMatch[2]) r.totalMax = parseInt(totalMatch[2]);
    } else if (r.breakdown.length > 0) {
      r.totalScore = r.breakdown.reduce((sum, b) => sum + b.score, 0);
    }

    // Parse strengths
    const strengthMatch = text.match(/(?:จุดแข็ง|strength|จุดเด่น|ข้อดี)[:\s]*\n?([\s\S]*?)(?=(?:จุดอ่อน|weakness|ข้อควรปรับปรุง|สิ่งที่ควร)|$)/i);
    if (strengthMatch) {
      r.strengths = strengthMatch[1].split('\n').map(l => l.replace(/^[\s\-*•\d.)+]+/, '').trim()).filter(l => l);
    }

    // Parse weaknesses
    const weakMatch = text.match(/(?:จุดอ่อน|weakness|ข้อควรปรับปรุง|ข้อที่ควรพัฒนา)[:\s]*\n?([\s\S]*?)(?=(?:ข้อเสนอแนะ|suggestion|คำแนะนำ)|$)/i);
    if (weakMatch) {
      r.weaknesses = weakMatch[1].split('\n').map(l => l.replace(/^[\s\-*•\d.)+]+/, '').trim()).filter(l => l);
    }

    // Parse suggestions
    const sugMatch = text.match(/(?:ข้อเสนอแนะ|suggestion|คำแนะนำ)[:\s]*\n?([\s\S]*?)$/i);
    if (sugMatch) {
      r.suggestions = sugMatch[1].split('\n').map(l => l.replace(/^[\s\-*•\d.)+]+/, '').trim()).filter(l => l);
    }

    return r;
  };

  const exportAsText = () => {
    if (!result) return;
    const lines = [];
    lines.push('=== ผลการให้คะแนนโดย AI ===');
    lines.push(`คะแนนรวม: ${result.totalScore}/${result.totalMax}`);
    lines.push('');
    if (result.breakdown.length > 0) {
      lines.push('--- รายละเอียดคะแนน ---');
      result.breakdown.forEach(b => {
        lines.push(`${b.criterion}: ${b.score}/${b.max}${b.comment ? ' - ' + b.comment : ''}`);
      });
      lines.push('');
    }
    if (result.strengths.length > 0) {
      lines.push('--- จุดแข็ง ---');
      result.strengths.forEach(s => lines.push(`- ${s}`));
      lines.push('');
    }
    if (result.weaknesses.length > 0) {
      lines.push('--- จุดอ่อน ---');
      result.weaknesses.forEach(w => lines.push(`- ${w}`));
      lines.push('');
    }
    if (result.suggestions.length > 0) {
      lines.push('--- ข้อเสนอแนะ ---');
      result.suggestions.forEach(s => lines.push(`- ${s}`));
      lines.push('');
    }
    lines.push('');
    lines.push('--- ผลลัพธ์แบบเต็ม ---');
    lines.push(result.raw);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `grading_result_${Date.now()}.txt`;
    a.click();
    toast.success('ส่งออกเป็นไฟล์ .txt แล้ว');
  };

  const scorePercent = result ? Math.round((result.totalScore / result.totalMax) * 100) : 0;
  const scoreColor = scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#f59e0b' : scorePercent >= 40 ? '#f97316' : '#ef4444';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: result ? '420px 1fr' : '1fr', gap: '24px' }}>
        {/* Input Panel */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>
            📝 AI Auto Grader
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
            วางเกณฑ์การให้คะแนน (Rubric) และงานนักศึกษา แล้ว AI จะให้คะแนนพร้อมความคิดเห็นโดยละเอียด
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>เกณฑ์การให้คะแนน (Rubric) *</label>
            <textarea
              value={rubric}
              onChange={e => setRubric(e.target.value)}
              placeholder={'เช่น\n1. ความถูกต้องของเนื้อหา (30 คะแนน)\n2. การวิเคราะห์และสังเคราะห์ (25 คะแนน)\n3. การนำเสนอและรูปแบบ (20 คะแนน)\n4. การอ้างอิง (15 คะแนน)\n5. ความคิดสร้างสรรค์ (10 คะแนน)'}
              style={{ ...inp, minHeight: '150px', resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>งานนักศึกษา *</label>
            <textarea
              value={studentWork}
              onChange={e => setStudentWork(e.target.value)}
              placeholder="วางเนื้อหางานนักศึกษาที่ต้องการให้ AI ตรวจ..."
              style={{ ...inp, minHeight: '180px', resize: 'vertical', lineHeight: 1.7 }}
            />
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{studentWork.length} ตัวอักษร</div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>คะแนนเต็ม</label>
            <input
              type="number"
              value={maxScore}
              onChange={e => setMaxScore(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              style={{ ...inp, width: '120px' }}
            />
          </div>

          <button onClick={grade} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '17px', fontFamily: FONT,
          }}>
            {loading ? '⏳ AI กำลังตรวจงาน...' : '🔍 ให้คะแนนงาน'}
          </button>
        </div>

        {/* Results Panel */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Score Header Card */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: '24px',
            }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                border: `6px solid ${scoreColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: scoreColor }}>{result.totalScore}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>/ {result.totalMax}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: CI.dark, marginBottom: '8px' }}>
                  ผลการให้คะแนน ({scorePercent}%)
                </div>
                <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${scorePercent}%`, background: scoreColor, borderRadius: '6px', transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
                  {scorePercent >= 80 ? 'ดีมาก' : scorePercent >= 60 ? 'พอใช้' : scorePercent >= 40 ? 'ต้องปรับปรุง' : 'ไม่ผ่านเกณฑ์'}
                </div>
              </div>
              <button onClick={exportAsText} style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                color: '#fff', cursor: 'pointer',
                fontWeight: 600, fontSize: '15px', fontFamily: FONT, whiteSpace: 'nowrap',
              }}>
                📥 ส่งออก .txt
              </button>
            </div>

            {/* Score Breakdown */}
            {result.breakdown.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: CI.dark, fontWeight: 700 }}>📊 รายละเอียดคะแนน</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.breakdown.map((b, i) => {
                    const pct = Math.round((b.score / b.max) * 100);
                    const c = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={i} style={{ padding: '12px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: CI.dark }}>{b.criterion}</span>
                          <span style={{ fontSize: '15px', fontWeight: 700, color: c }}>{b.score}/{b.max}</span>
                        </div>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: b.comment ? '6px' : 0 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '3px' }} />
                        </div>
                        {b.comment && <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{b.comment}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths / Weaknesses / Suggestions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {result.strengths.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #10b98130' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: '#10b981', fontWeight: 700 }}>💪 จุดแข็ง</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'disc' }}>
                    {result.strengths.map((s, i) => (
                      <li key={i} style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.7, marginBottom: '4px' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.weaknesses.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #f59e0b30' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: '#f59e0b', fontWeight: 700 }}>⚠️ จุดอ่อน</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'disc' }}>
                    {result.weaknesses.map((w, i) => (
                      <li key={i} style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.7, marginBottom: '4px' }}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.suggestions.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #7c4dff30' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: CI.purple, fontWeight: 700 }}>💡 ข้อเสนอแนะ</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'disc' }}>
                    {result.suggestions.map((s, i) => (
                      <li key={i} style={{ fontSize: '15px', color: '#1e293b', lineHeight: 1.7, marginBottom: '4px' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Raw Output */}
            <details style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <summary style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>📄 ดูผลลัพธ์แบบเต็ม</summary>
              <div style={{
                marginTop: '12px', padding: '16px', background: '#f8fafc', borderRadius: '10px',
                fontSize: '14px', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap',
                maxHeight: '400px', overflowY: 'auto',
              }}>
                {result.raw}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
