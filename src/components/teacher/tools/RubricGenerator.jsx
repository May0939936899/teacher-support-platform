'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';
import { downloadCSV, downloadExcel, buildTableHTML, downloadHTMLAsPDF } from '@/lib/teacher/exportUtils';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LEVEL_LABELS = ['ดีเยี่ยม', 'ดี', 'พอใช้', 'ต้องปรับปรุง', 'ไม่ผ่าน'];
const LEVEL_COLORS = ['#10b981', '#22d3ee', '#f59e0b', '#f97316', '#ef4444'];
const LS_KEY = 'teacher_rubric_generator';

export default function RubricGenerator() {
  const [assignment, setAssignment] = useState('');
  const [criteriaCount, setCriteriaCount] = useState(4);
  const [levelCount, setLevelCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [rubric, setRubric] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.assignment) setAssignment(p.assignment);
        if (p.criteriaCount) setCriteriaCount(p.criteriaCount);
        if (p.levelCount) setLevelCount(p.levelCount);
        if (p.rubric) setRubric(p.rubric);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ assignment, criteriaCount, levelCount, rubric }));
    } catch {}
  }, [assignment, criteriaCount, levelCount, rubric]);

  const generate = async () => {
    if (!assignment.trim()) { toast.error('กรุณากรอกรายละเอียดงาน'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'rubric_generator',
          payload: { assignment, criteriaCount, levelCount },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseRubric(data.result, criteriaCount, levelCount);
      setRubric(parsed);
      toast.success('สร้าง Rubric แล้ว!');
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const parseRubric = (text, numCriteria, numLevels) => {
    const defaultNames = ['เนื้อหา/ความถูกต้อง', 'โครงสร้าง/การจัดลำดับ', 'การใช้ภาษา', 'หลักฐาน/อ้างอิง', 'ความคิดสร้างสรรค์', 'การนำเสนอ', 'ความสมบูรณ์', 'การทำงานร่วมกัน'];

    // Try JSON parsing first
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.criteria && Array.isArray(parsed.criteria)) {
        const finalCriteria = parsed.criteria.slice(0, numCriteria).map((c, i) => ({
          name: c.name || defaultNames[i] || `เกณฑ์ ${i + 1}`,
          levels: (c.levels || []).slice(0, numLevels).map((l, j) => ({
            label: l.level || LEVEL_LABELS[j] || `ระดับ ${j + 1}`,
            description: l.descriptor || l.description || '',
            score: parseInt(l.score) || (numLevels - j),
          })),
        }));
        return { criteria: finalCriteria, rawText: text };
      }
    } catch {}

    // Fallback: text-based parsing
    const scorePerLevel = Array.from({ length: numLevels }, (_, i) => numLevels - i);
    const lines = text.split('\n').filter(l => l.trim());
    const criteria = [];
    let currentCriterion = null;
    for (const line of lines) {
      const criterionMatch = line.match(/^(?:\d+[\.\)]\s*|[-*]\s*)(.+?)(?:\s*:|\s*$)/);
      if (criterionMatch && !currentCriterion) {
        currentCriterion = { name: criterionMatch[1].trim(), rawLevels: [] };
      } else if (currentCriterion) {
        currentCriterion.rawLevels.push(line.trim());
        if (currentCriterion.rawLevels.length >= numLevels) { criteria.push(currentCriterion); currentCriterion = null; }
      }
    }
    if (currentCriterion) criteria.push(currentCriterion);
    const finalCriteria = [];
    for (let i = 0; i < numCriteria; i++) {
      const c = criteria[i];
      const levels = [];
      for (let j = 0; j < numLevels; j++) {
        levels.push({ label: LEVEL_LABELS[j] || `ระดับ ${j + 1}`, description: c?.rawLevels[j] || '', score: scorePerLevel[j] });
      }
      finalCriteria.push({ name: c?.name || defaultNames[i] || `เกณฑ์ ${i + 1}`, levels });
    }
    return { criteria: finalCriteria, rawText: text };
  };

  const updateCellDesc = (cIdx, lIdx, value) => {
    setRubric(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.criteria[cIdx].levels[lIdx].description = value;
      return copy;
    });
  };

  const updateCriterionName = (cIdx, value) => {
    setRubric(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.criteria[cIdx].name = value;
      return copy;
    });
  };

  const updateScore = (cIdx, lIdx, value) => {
    setRubric(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.criteria[cIdx].levels[lIdx].score = parseInt(value) || 0;
      return copy;
    });
  };

  const copyAsTable = () => {
    if (!rubric) return;
    const header = ['เกณฑ์', ...rubric.criteria[0].levels.map(l => l.label)].join('\t');
    const rows = rubric.criteria.map(c =>
      [c.name, ...c.levels.map(l => `${l.description} (${l.score} คะแนน)`)].join('\t')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    toast.success('คัดลอกตาราง Rubric แล้ว (วางใน Excel ได้)');
  };

  const getRubricData = () => {
    if (!rubric) return { headers: [], rows: [] };
    const headers = ['เกณฑ์', ...rubric.criteria[0].levels.map(l => l.label)];
    const rows = rubric.criteria.map(c => [c.name, ...c.levels.map(l => `${l.description} (${l.score} คะแนน)`)]);
    return { headers, rows };
  };

  const handleDownloadCSV = () => {
    if (!rubric) return;
    const { headers, rows } = getRubricData();
    const escCsv = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [[...headers].map(escCsv).join(','), ...rows.map(r => r.map(escCsv).join(','))];
    downloadCSV(lines.join('\n'), `rubric_${Date.now()}`);
    toast.success('ดาวน์โหลด CSV แล้ว');
  };

  const handleDownloadExcel = () => {
    if (!rubric) return;
    const { headers, rows } = getRubricData();
    downloadExcel(headers, rows, `rubric_${Date.now()}`, 'Rubric');
    toast.success('ดาวน์โหลด Excel แล้ว');
  };

  const handleDownloadPDF = async () => {
    if (!rubric) return;
    const { headers, rows } = getRubricData();
    const html = buildTableHTML(`Rubric: ${rubric.subject || ''}`, headers, rows);
    await downloadHTMLAsPDF(html, `rubric_${Date.now()}`);
    toast.success('ดาวน์โหลด PDF แล้ว');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      {!rubric ? (
        /* Input Form */
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>
              📏 AI สร้าง Rubric ตาราง
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
              กรอกรายละเอียดงานที่มอบหมาย เลือกจำนวนเกณฑ์และระดับ แล้ว AI จะสร้าง Rubric ให้อัตโนมัติ สามารถแก้ไขได้ทีหลัง
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>รายละเอียดงานที่มอบหมาย *</label>
              <textarea
                value={assignment}
                onChange={e => setAssignment(e.target.value)}
                placeholder="เช่น เขียนรายงานวิเคราะห์กลยุทธ์การตลาดของแบรนด์ที่เลือก ความยาว 10-15 หน้า..."
                style={{ ...inp, minHeight: '150px', resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>จำนวนเกณฑ์ (3-8)</label>
                <select value={criteriaCount} onChange={e => setCriteriaCount(parseInt(e.target.value))} style={inp}>
                  {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} เกณฑ์</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>จำนวนระดับ (3-5)</label>
                <select value={levelCount} onChange={e => setLevelCount(parseInt(e.target.value))} style={inp}>
                  {[3, 4, 5].map(n => <option key={n} value={n}>{n} ระดับ</option>)}
                </select>
              </div>
            </div>

            <button onClick={generate} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '17px', fontFamily: FONT,
            }}>
              {loading ? '⏳ AI กำลังสร้าง Rubric...' : '✨ สร้าง Rubric'}
            </button>
          </div>
        </div>
      ) : (
        /* Rubric Table */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '22px', color: CI.dark, fontWeight: 700 }}>📏 Rubric ตาราง</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setRubric(null)} style={actBtn}>← สร้างใหม่</button>
              <button onClick={copyAsTable} style={actBtn}>📋 คัดลอก</button>
              <DownloadDropdown
                options={[
                  { label: 'CSV', icon: '📊', ext: 'CSV', color: '#0369a1', onClick: handleDownloadCSV },
                  { label: 'Excel', icon: '📗', ext: 'XLS', color: '#16a34a', onClick: handleDownloadExcel },
                  { label: 'PDF', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: handleDownloadPDF },
                ]}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '14px 16px', background: CI.dark, color: '#fff',
                    fontSize: '15px', fontWeight: 700, textAlign: 'left', minWidth: '140px',
                    fontFamily: FONT,
                  }}>
                    เกณฑ์
                  </th>
                  {Array.from({ length: levelCount }, (_, i) => (
                    <th key={i} style={{
                      padding: '14px 16px', background: LEVEL_COLORS[i] || '#64748b',
                      color: '#fff', fontSize: '15px', fontWeight: 700, textAlign: 'center', minWidth: '160px',
                      fontFamily: FONT,
                    }}>
                      {LEVEL_LABELS[i] || `ระดับ ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rubric.criteria.map((c, cIdx) => (
                  <tr key={cIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', verticalAlign: 'top', background: '#f8fafc' }}>
                      <input
                        value={c.name}
                        onChange={e => updateCriterionName(cIdx, e.target.value)}
                        style={{
                          width: '100%', border: 'none', background: 'none',
                          fontSize: '15px', fontWeight: 700, color: CI.dark,
                          outline: 'none', fontFamily: FONT, padding: '4px',
                        }}
                      />
                    </td>
                    {c.levels.map((l, lIdx) => (
                      <td key={lIdx} style={{ padding: '8px', verticalAlign: 'top' }}>
                        <textarea
                          value={l.description}
                          onChange={e => updateCellDesc(cIdx, lIdx, e.target.value)}
                          style={{
                            width: '100%', border: '1px solid transparent', borderRadius: '6px',
                            background: 'none', fontSize: '14px', color: '#1e293b',
                            outline: 'none', fontFamily: FONT, padding: '6px',
                            minHeight: '70px', resize: 'vertical', lineHeight: 1.5,
                            boxSizing: 'border-box',
                          }}
                          onFocus={e => { e.target.style.border = `1px solid ${CI.cyan}`; e.target.style.background = '#f8fafc'; }}
                          onBlur={e => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'none'; }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 6px' }}>
                          <span style={{ fontSize: '14px', color: '#94a3b8' }}>คะแนน:</span>
                          <input
                            type="number" min="0" max="100"
                            value={l.score}
                            onChange={e => updateScore(cIdx, lIdx, e.target.value)}
                            style={{
                              width: '50px', border: '1px solid #e2e8f0', borderRadius: '4px',
                              padding: '2px 6px', fontSize: '14px', fontWeight: 700,
                              color: LEVEL_COLORS[lIdx], textAlign: 'center', outline: 'none',
                              fontFamily: FONT,
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Raw AI Output */}
          {rubric.rawText && (
            <details style={{ marginTop: '20px', background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <summary style={{ cursor: 'pointer', fontSize: '15px', color: '#64748b', fontWeight: 600 }}>
                📄 ดูผลลัพธ์ AI ดิบ
              </summary>
              <div style={{
                background: '#f8fafc', borderRadius: '12px', padding: '20px', marginTop: '10px',
                fontSize: '15px', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap',
                maxHeight: '300px', overflowY: 'auto',
              }}>
                {rubric.rawText}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actBtn = { padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', fontWeight: 600 };
