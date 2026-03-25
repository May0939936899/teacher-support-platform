'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';
import { downloadCSV as dlCSV, buildTextHTML, downloadHTMLAsPDF } from '@/lib/teacher/exportUtils';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function AutoGrader() {
  const [rubric, setRubric] = useState('');
  const [studentWork, setStudentWork] = useState('');
  const [studentInputMode, setStudentInputMode] = useState('text'); // text | file
  const [studentFile, setStudentFile] = useState(null);
  const [studentFileContent, setStudentFileContent] = useState('');
  const [studentImageBase64, setStudentImageBase64] = useState(null);
  const [studentImageType, setStudentImageType] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  // ===== FILE HANDLING =====
  const handleStudentFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg'];
    if (!validExts.includes(ext)) {
      toast.error('รองรับไฟล์ PDF, WORD (.docx), PNG, JPG เท่านั้น');
      return;
    }
    setStudentFile(file);
    setStudentFileContent('');
    setStudentImageBase64(null);
    setFileLoading(true);

    try {
      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const base64 = ev.target.result.split(',')[1];
            const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';
            setStudentImageBase64(base64);
            setStudentImageType(mediaType);
            toast.success('โหลดรูปภาพแล้ว — AI จะวิเคราะห์จากรูป');
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if (ext === 'pdf') {
        toast('กำลังอ่าน PDF...');
        const loadPdfJs = () => new Promise((resolve, reject) => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            return resolve(window.pdfjsLib);
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve(window.pdfjsLib);
            } else reject(new Error('pdfjsLib not found'));
          };
          script.onerror = () => reject(new Error('Failed to load pdf.js'));
          document.head.appendChild(script);
          setTimeout(() => reject(new Error('pdf.js timeout')), 15000);
        });
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let allText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          allText += content.items.map(item => item.str).join(' ') + '\n';
        }
        setStudentFileContent(allText.trim());
        toast.success(`อ่าน PDF สำเร็จ (${pdf.numPages} หน้า • ${allText.length} ตัวอักษร)`);
      } else if (['docx', 'doc'].includes(ext)) {
        toast('กำลังอ่านไฟล์ Word...');
        const loadMammoth = () => new Promise((resolve, reject) => {
          if (window.mammoth) return resolve(window.mammoth);
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
          script.onload = () => { if (window.mammoth) resolve(window.mammoth); else reject(new Error('mammoth not found')); };
          script.onerror = () => reject(new Error('Failed to load mammoth.js'));
          document.head.appendChild(script);
          setTimeout(() => reject(new Error('mammoth timeout')), 15000);
        });
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setStudentFileContent(res.value.trim());
        toast.success(`อ่านไฟล์ Word สำเร็จ (${res.value.length} ตัวอักษร)`);
      }
    } catch (err) {
      toast.error('อ่านไฟล์ไม่สำเร็จ: ' + err.message);
      setStudentFile(null);
    } finally {
      setFileLoading(false);
    }
  };

  const removeFile = () => {
    setStudentFile(null);
    setStudentFileContent('');
    setStudentImageBase64(null);
    setStudentImageType(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ===== GRADING =====
  const grade = async () => {
    if (!rubric.trim()) { toast.error('กรุณากรอกเกณฑ์การให้คะแนน (Rubric)'); return; }

    const useImage = studentInputMode === 'file' && studentImageBase64;
    const useText = studentInputMode === 'text' ? studentWork.trim() : studentFileContent.trim();

    if (!useImage && !useText) {
      toast.error(studentInputMode === 'file' ? 'กรุณาอัพโหลดไฟล์งานนักศึกษา' : 'กรุณากรอกงานนักศึกษา');
      return;
    }

    setLoading(true);
    try {
      let body;
      if (useImage) {
        body = { tool: 'auto_grader_vision', payload: { rubric, imageBase64: studentImageBase64, mediaType: studentImageType, maxScore } };
      } else {
        body = { tool: 'auto_grader', payload: { rubric, submission: useText, maxScore } };
      }
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(parseResult(data.result || '', maxScore));
      toast.success('ให้คะแนนเสร็จแล้ว!');
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ===== PARSE RESULT =====
  const parseResult = (text, maxSc) => {
    // Try JSON parse first (structured response)
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const j = JSON.parse(jsonMatch[0]);
        return {
          breakdown: (j.criteria_scores || []).map(c => ({
            criterion: c.criterion || '',
            score: Number(c.score) || 0,
            max: Number(c.max) || 0,
            comment: c.comment || '',
          })),
          totalScore: Number(j.total_score) || 0,
          totalMax: Number(j.max_score) || maxSc,
          grade: j.grade || '',
          strengths: j.strengths || [],
          weaknesses: j.improvements || [],
          overallFeedback: j.overall_feedback || '',
          raw: text,
        };
      }
    } catch {}

    // Fallback: regex parsing
    const r = { breakdown: [], totalScore: 0, totalMax: maxSc, grade: '', strengths: [], weaknesses: [], overallFeedback: '', raw: text };
    const totalMatch = text.match(/(?:รวม|total|คะแนนรวม)[:\s]*(\d+)\s*(?:\/\s*(\d+))?/i);
    if (totalMatch) { r.totalScore = parseInt(totalMatch[1]); if (totalMatch[2]) r.totalMax = parseInt(totalMatch[2]); }
    return r;
  };

  // ===== EXPORT =====
  const exportAsText = () => {
    if (!result) return;
    const lines = ['=== ผลการให้คะแนนโดย AI ===', `คะแนนรวม: ${result.totalScore}/${result.totalMax}${result.grade ? ' เกรด: ' + result.grade : ''}`, ''];
    if (result.breakdown.length > 0) {
      lines.push('--- รายละเอียดคะแนน ---');
      result.breakdown.forEach(b => lines.push(`${b.criterion}: ${b.score}/${b.max}${b.comment ? ' - ' + b.comment : ''}`));
      lines.push('');
    }
    if (result.strengths.length > 0) { lines.push('--- จุดแข็ง ---'); result.strengths.forEach(s => lines.push(`- ${s}`)); lines.push(''); }
    if (result.weaknesses.length > 0) { lines.push('--- จุดที่ควรปรับปรุง ---'); result.weaknesses.forEach(w => lines.push(`- ${w}`)); lines.push(''); }
    if (result.overallFeedback) { lines.push('--- ความคิดเห็นโดยรวม ---'); lines.push(result.overallFeedback); }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `grading_${Date.now()}.txt`; a.click();
    toast.success('ส่งออก TXT แล้ว');
  };

  const exportAsCSV = () => {
    if (!result) return;
    const rows = result.breakdown.length > 0
      ? result.breakdown.map(b => [b.criterion, b.score, b.max, b.comment || ''])
      : [['รวม', result.totalScore, result.totalMax, result.overallFeedback || '']];
    const lines = [['เกณฑ์', 'คะแนนที่ได้', 'คะแนนเต็ม', 'ความคิดเห็น'].join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))];
    dlCSV(lines.join('\n'), `grading_${Date.now()}`);
    toast.success('ส่งออก CSV แล้ว');
  };

  const exportAsPDF = async () => {
    if (!result) return;
    const text = [`คะแนนรวม: ${result.totalScore}/${result.totalMax}${result.grade ? '  เกรด: ' + result.grade : ''}`,
      result.breakdown.length > 0 ? '\n--- รายละเอียดคะแนน ---\n' + result.breakdown.map(b => `${b.criterion}: ${b.score}/${b.max}${b.comment ? ' - ' + b.comment : ''}`).join('\n') : '',
      result.strengths.length > 0 ? '\n--- จุดแข็ง ---\n' + result.strengths.map(s => `• ${s}`).join('\n') : '',
      result.weaknesses.length > 0 ? '\n--- จุดที่ควรปรับปรุง ---\n' + result.weaknesses.map(w => `• ${w}`).join('\n') : '',
      result.overallFeedback ? '\n--- ความคิดเห็นโดยรวม ---\n' + result.overallFeedback : '',
    ].filter(Boolean).join('\n');
    const html = buildTextHTML('ผลการให้คะแนนโดย AI', text);
    await downloadHTMLAsPDF(html, `grading_${Date.now()}`);
    toast.success('ส่งออก PDF แล้ว');
  };

  const scorePercent = result ? Math.round((result.totalScore / result.totalMax) * 100) : 0;
  const scoreColor = scorePercent >= 80 ? '#10b981' : scorePercent >= 60 ? '#f59e0b' : scorePercent >= 40 ? '#f97316' : '#ef4444';
  const scoreLabel = scorePercent >= 80 ? 'ดีมาก' : scorePercent >= 60 ? 'พอใช้' : scorePercent >= 40 ? 'ต้องปรับปรุง' : 'ไม่ผ่านเกณฑ์';

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '24px', color: CI.dark, fontWeight: 800 }}>📝 AI Auto Grader</h3>
        <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>วางเกณฑ์และงานนักศึกษา แล้ว AI ตรวจพร้อมให้คะแนนตาม Rubric อย่างเข้มงวด</p>
      </div>

      {/* Two-panel input area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* LEFT: Rubric */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CI.cyan }} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: CI.dark }}>เกณฑ์การให้คะแนน (Rubric)</span>
            <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700 }}>*</span>
          </div>
          <textarea
            value={rubric}
            onChange={e => setRubric(e.target.value)}
            placeholder={'ตัวอย่าง:\n1. ความถูกต้องของเนื้อหา (30 คะแนน)\n   - ตอบครบทุกประเด็น: 30\n   - ตอบบางประเด็น: 15-25\n   - ตอบไม่ครบ: 0-14\n\n2. การวิเคราะห์และสังเคราะห์ (30 คะแนน)\n3. รูปแบบการนำเสนอ (20 คะแนน)\n4. การอ้างอิง (20 คะแนน)'}
            style={{ ...inp, flex: 1, minHeight: '260px', resize: 'vertical', lineHeight: 1.8, fontSize: '14px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>คะแนนเต็ม:</label>
            <input
              type="number" value={maxScore} min={1}
              onChange={e => setMaxScore(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ ...inp, width: '90px', textAlign: 'center', padding: '8px' }}
            />
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>คะแนน</span>
          </div>
        </div>

        {/* RIGHT: Student Work */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CI.magenta }} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: CI.dark }}>งานนักศึกษา</span>
              <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 700 }}>*</span>
            </div>
            {/* Input mode toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              {[
                { id: 'text', label: '📝 ข้อความ' },
                { id: 'file', label: '📎 ไฟล์' },
              ].map(m => (
                <button key={m.id} onClick={() => setStudentInputMode(m.id)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: studentInputMode === m.id ? '#fff' : 'transparent',
                  color: studentInputMode === m.id ? CI.dark : '#94a3b8',
                  fontWeight: studentInputMode === m.id ? 700 : 400, fontSize: '13px', fontFamily: 'inherit',
                  boxShadow: studentInputMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text mode */}
          {studentInputMode === 'text' && (
            <>
              <textarea
                value={studentWork}
                onChange={e => setStudentWork(e.target.value)}
                placeholder="วางเนื้อหางานนักศึกษาที่ต้องการให้ AI ตรวจที่นี่..."
                style={{ ...inp, flex: 1, minHeight: '260px', resize: 'vertical', lineHeight: 1.8, fontSize: '14px' }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{studentWork.length} ตัวอักษร</div>
            </>
          )}

          {/* File mode */}
          {studentInputMode === 'file' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {!studentFile ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = CI.magenta; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; if (e.dataTransfer.files[0]) handleStudentFile({ target: { files: e.dataTransfer.files } }); }}
                  style={{
                    flex: 1, minHeight: '260px', border: `2px dashed #cbd5e1`, borderRadius: '14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', background: '#fafafa', gap: '10px', transition: 'all 0.2s',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={handleStudentFile} style={{ display: 'none' }} />
                  <div style={{ fontSize: '42px' }}>📂</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { label: 'PDF', color: '#dc2626', bg: '#fef2f2' },
                      { label: 'WORD', color: '#1d4ed8', bg: '#eff6ff' },
                      { label: 'PNG', color: '#7c3aed', bg: '#f5f3ff' },
                      { label: 'JPG', color: '#059669', bg: '#f0fdf4' },
                    ].map(f => (
                      <span key={f.label} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: f.color, background: f.bg }}>{f.label}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* File info card */}
                  <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>
                      {studentFile.name.endsWith('.pdf') ? '📕' : studentFile.name.match(/\.docx?$/) ? '📘' : '🖼️'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: CI.dark }}>{studentFile.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {(studentFile.size / 1024).toFixed(0)} KB
                        {studentFileContent && ` • ${studentFileContent.length} ตัวอักษร`}
                        {studentImageBase64 && ' • พร้อมส่ง AI วิเคราะห์'}
                        {fileLoading && ' • กำลังอ่าน...'}
                      </div>
                    </div>
                    <button onClick={removeFile} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>
                      ✕ ลบ
                    </button>
                  </div>

                  {/* Image preview */}
                  {studentImageBase64 && (
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <img
                        src={`data:${studentImageType};base64,${studentImageBase64}`}
                        alt="student work"
                        style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '10px', border: '1px solid #e2e8f0', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {/* Extracted text preview */}
                  {studentFileContent && (
                    <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: 1.7, color: '#334155', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {studentFileContent.slice(0, 600)}{studentFileContent.length > 600 ? '...' : ''}
                    </div>
                  )}

                  {/* Upload another */}
                  <button onClick={() => fileRef.current?.click()} style={{ padding: '8px', borderRadius: '8px', border: `1.5px dashed #cbd5e1`, background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
                    + เลือกไฟล์อื่น
                  </button>
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" onChange={handleStudentFile} style={{ display: 'none' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade button */}
      <button onClick={grade} disabled={loading} style={{
        width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
        background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`,
        color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 800, fontSize: '18px', fontFamily: FONT,
        boxShadow: loading ? 'none' : `0 4px 20px ${CI.magenta}40`,
        transition: 'all 0.2s',
      }}>
        {loading ? '⏳ AI กำลังตรวจงาน...' : '🔍 ให้คะแนนงาน'}
      </button>

      {/* ===== RESULTS ===== */}
      {result && (
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Score header */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Score circle */}
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${scoreColor}08` }}>
              <div style={{ fontSize: '30px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{result.totalScore}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>/ {result.totalMax}</div>
              {result.grade && <div style={{ fontSize: '16px', fontWeight: 800, color: scoreColor, marginTop: '2px' }}>{result.grade}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: CI.dark, marginBottom: '10px' }}>
                ผลการให้คะแนน — {scorePercent}% <span style={{ fontSize: '15px', color: scoreColor, fontWeight: 600 }}>({scoreLabel})</span>
              </div>
              <div style={{ height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${scorePercent}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}bb)`, borderRadius: '7px', transition: 'width 0.6s ease' }} />
              </div>
              {result.overallFeedback && (
                <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginTop: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                  {result.overallFeedback}
                </div>
              )}
            </div>
            <DownloadDropdown options={[
              { label: 'Text', icon: '📝', ext: 'TXT', color: '#64748b', onClick: exportAsText },
              { label: 'CSV', icon: '📊', ext: 'CSV', color: '#0369a1', onClick: exportAsCSV },
              { label: 'PDF', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: exportAsPDF },
            ]} />
          </div>

          {/* Score Breakdown */}
          {result.breakdown.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: CI.dark, fontWeight: 700 }}>📊 รายละเอียดคะแนนตามเกณฑ์</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.breakdown.map((b, i) => {
                  const pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
                  const c = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';
                  return (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: `1px solid ${c}20` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: CI.dark }}>{b.criterion}</span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: c, background: `${c}15`, padding: '2px 10px', borderRadius: '8px' }}>{b.score}/{b.max}</span>
                      </div>
                      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: b.comment ? '8px' : 0 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                      {b.comment && <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginTop: '4px' }}>{b.comment}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths + Weaknesses */}
          {(result.strengths.length > 0 || result.weaknesses.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {result.strengths.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #10b98120' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: '#10b981', fontWeight: 700 }}>💪 จุดแข็ง</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                    {result.strengths.map((s, i) => <li key={i} style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.7, marginBottom: '4px' }}>{s}</li>)}
                  </ul>
                </div>
              )}
              {result.weaknesses.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #f59e0b20' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: '#f59e0b', fontWeight: 700 }}>⚠️ ควรปรับปรุง</h4>
                  <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                    {result.weaknesses.map((w, i) => <li key={i} style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.7, marginBottom: '4px' }}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Raw output */}
          <details style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <summary style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>📄 ดูผลลัพธ์แบบเต็ม</summary>
            <div style={{ marginTop: '12px', padding: '14px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', lineHeight: 1.7, color: '#1e293b', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
              {result.raw}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit', background: '#fff' };
