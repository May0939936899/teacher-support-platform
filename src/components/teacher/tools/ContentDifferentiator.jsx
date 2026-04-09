'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const LEVELS = [
  { id: 'easy', label: 'Easy', emoji: '🟢', color: '#10b981', desc: 'ภาษาง่าย เนื้อหาพื้นฐาน' },
  { id: 'medium', label: 'Medium', emoji: '🟡', color: '#f59e0b', desc: 'เนื้อหาสมดุล มีตัวอย่างประกอบ' },
  { id: 'hard', label: 'Hard', emoji: '🔴', color: '#ef4444', desc: 'เชิงลึก ท้าทาย วิเคราะห์' },
];

const LS_KEY = 'teacher_content_differentiator';

export default function ContentDifferentiator() {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedLevels, setSelectedLevels] = useState({ easy: true, medium: true, hard: true });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('easy');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.content) setContent(p.content);
        if (p.subject) setSubject(p.subject);
        if (p.selectedLevels) setSelectedLevels(p.selectedLevels);
        if (p.results) setResults(p.results);
        if (p.activeTab) setActiveTab(p.activeTab);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ content, subject, selectedLevels, results, activeTab }));
    } catch {}
  }, [content, subject, selectedLevels, results, activeTab]);

  const toggleLevel = (id) => {
    setSelectedLevels(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!Object.values(next).some(v => v)) {
        toast.error('ต้องเลือกอย่างน้อย 1 ระดับ');
        return prev;
      }
      return next;
    });
  };

  const generate = async () => {
    if (!content.trim()) { toast.error('กรุณากรอกเนื้อหาบทเรียน'); return; }
    const levels = Object.entries(selectedLevels).filter(([, v]) => v).map(([k]) => k);
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'content_differentiator', payload: { content, subject, levels } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseVersions(data.result || '');
      setResults(parsed);
      setActiveTab(levels[0]);
      toast.success('สร้างเนื้อหาตามระดับเสร็จแล้ว!');
    } catch (e) {
      toast.error(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const parseVersions = (text) => {
    const sections = { easy: '', medium: '', hard: '' };
    // Match ## EASY / ## MEDIUM / ## HARD sections (new format)
    const easyMatch = text.match(/##\s*EASY[\s\S]*?\n([\s\S]*?)(?=##\s*MEDIUM|##\s*HARD|$)/i);
    const medMatch  = text.match(/##\s*MEDIUM[\s\S]*?\n([\s\S]*?)(?=##\s*EASY|##\s*HARD|$)/i);
    const hardMatch = text.match(/##\s*HARD[\s\S]*?\n([\s\S]*?)(?=##\s*EASY|##\s*MEDIUM|$)/i);
    if (easyMatch) sections.easy = easyMatch[1].trim();
    if (medMatch)  sections.medium = medMatch[1].trim();
    if (hardMatch) sections.hard = hardMatch[1].trim();
    // Fallback: old format with Thai keywords
    if (!sections.easy && !sections.medium && !sections.hard) {
      const eM = text.match(/(?:easy|ง่าย|พื้นฐาน)[:\s]*\n?([\s\S]*?)(?=(?:medium|ปานกลาง|กลาง)|$)/i);
      const mM = text.match(/(?:medium|ปานกลาง|กลาง)[:\s]*\n?([\s\S]*?)(?=(?:hard|ยาก|ท้าทาย)|$)/i);
      const hM = text.match(/(?:hard|ยาก|ท้าทาย)[:\s]*\n?([\s\S]*?)$/i);
      if (eM) sections.easy = eM[1].trim();
      if (mM) sections.medium = mM[1].trim();
      if (hM) sections.hard = hM[1].trim();
    }
    // Last resort: split into thirds
    if (!sections.easy && !sections.medium && !sections.hard) {
      const lines = text.split('\n').filter(l => l.trim());
      const third = Math.ceil(lines.length / 3);
      sections.easy = lines.slice(0, third).join('\n');
      sections.medium = lines.slice(third, third * 2).join('\n');
      sections.hard = lines.slice(third * 2).join('\n');
    }
    return sections;
  };

  const copyVersion = (levelId) => {
    if (!results || !results[levelId]) return;
    navigator.clipboard.writeText(results[levelId]);
    toast.success(`คัดลอกเวอร์ชัน ${levelId} แล้ว`);
  };

  const activeLevels = LEVELS.filter(l => selectedLevels[l.id]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: results ? '400px 1fr' : '1fr', gap: '24px' }}>
        {/* Input Panel */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: CI.dark, fontWeight: 700 }}>
            🎯 AI ปรับเนื้อหาตามระดับ
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#64748b', lineHeight: 1.6 }}>
            ใส่เนื้อหาบทเรียน เลือกระดับ (ง่าย/กลาง/ยาก) แล้ว AI จะปรับเนื้อหาให้เหมาะสมกับแต่ละระดับ
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>วิชา / หัวข้อ</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="เช่น หลักการตลาดเบื้องต้น"
              style={inp}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>เนื้อหาบทเรียน *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="วางเนื้อหาบทเรียนที่ต้องการให้ AI ปรับระดับที่นี่..."
              style={{ ...inp, minHeight: '200px', resize: 'vertical', lineHeight: 1.7 }}
            />
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{content.length} ตัวอักษร</div>
          </div>

          {/* Level Checkboxes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>เลือกระดับที่ต้องการ</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LEVELS.map(l => (
                <div
                  key={l.id}
                  onClick={() => toggleLevel(l.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${selectedLevels[l.id] ? l.color : '#e2e8f0'}`,
                    background: selectedLevels[l.id] ? `${l.color}10` : '#fafafa',
                    transition: 'all 0.2s', userSelect: 'none',
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                    border: `2px solid ${selectedLevels[l.id] ? l.color : '#cbd5e1'}`,
                    background: selectedLevels[l.id] ? l.color : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                  }}>
                    {selectedLevels[l.id] && '✓'}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: l.color }}>{l.emoji} {l.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '17px', fontFamily: FONT,
          }}>
            {loading ? '⏳ AI กำลังสร้างเวอร์ชัน...' : '✨ สร้างเนื้อหาตามระดับ'}
          </button>
        </div>

        {/* Results Panel with Tabs */}
        {results && (
          <div style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#fafafa' }}>
              {activeLevels.map(l => (
                <button key={l.id} onClick={() => setActiveTab(l.id)} style={{
                  flex: 1, padding: '14px 16px', border: 'none', cursor: 'pointer',
                  background: activeTab === l.id ? '#fff' : 'transparent',
                  borderBottom: activeTab === l.id ? `3px solid ${l.color}` : '3px solid transparent',
                  fontFamily: FONT, fontSize: '16px', fontWeight: activeTab === l.id ? 700 : 500,
                  color: activeTab === l.id ? l.color : '#64748b',
                  transition: 'all 0.2s',
                }}>
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeLevels.map(l => (
              activeTab === l.id && (
                <div key={l.id} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid #f1f5f9',
                  }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{l.desc}</span>
                    <button onClick={() => copyVersion(l.id)} style={{
                      padding: '8px 16px', borderRadius: '8px', border: `1px solid ${l.color}40`,
                      background: `${l.color}10`, color: l.color, cursor: 'pointer',
                      fontWeight: 600, fontSize: '14px', fontFamily: FONT,
                    }}>
                      📋 คัดลอก
                    </button>
                  </div>
                  <div style={{
                    padding: '20px', fontSize: '15px', lineHeight: 1.8,
                    color: '#1e293b', whiteSpace: 'pre-wrap', flex: 1,
                    overflowY: 'auto', maxHeight: '500px',
                  }}>
                    {results[l.id] || 'ไม่มีเนื้อหาสำหรับระดับนี้'}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
