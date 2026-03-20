'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const inp = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid #e2e8f0', fontSize: '15px', fontFamily: 'inherit',
  outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box',
};
const lbl = { display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' };

const STYLES = [
  { id: 'academic', label: 'Academic', icon: '🎓', desc: 'สไตล์วิชาการ เป็นทางการ' },
  { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'เข้าถึงง่าย อ่านสนุก' },
  { id: 'visual', label: 'Visual Guide', icon: '🎨', desc: 'เน้นภาพ Diagram Infographic' },
  { id: 'workshop', label: 'Workshop', icon: '🛠️', desc: 'เน้นฝึกทำ Step-by-step' },
];

export default function EbookBuilder() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('นักศึกษาปริญญาตรี');
  const [numChapters, setNumChapters] = useState(5);
  const [style, setStyle] = useState('academic');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChapter, setLoadingChapter] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [editingChapter, setEditingChapter] = useState(null);
  const previewRef = useRef(null);

  const generateOutline = async () => {
    if (!topic.trim()) return toast.error('กรุณาระบุหัวข้อ E-book');
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'ebook-outline',
          payload: { title: title || topic, topic, audience, numChapters, style }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const raw = data.result || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI ตอบไม่ตรง format');
      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.chapters?.length) throw new Error('ไม่พบบท');

      setTitle(parsed.title || title || topic);
      setChapters(parsed.chapters.map((ch, i) => ({
        id: i,
        title: ch.title || `บทที่ ${i + 1}`,
        summary: ch.summary || '',
        sections: ch.sections || [],
        content: '',
        generated: false,
      })));
      toast.success(`สร้าง Outline ${parsed.chapters.length} บทสำเร็จ!`);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateChapterContent = async (chapterIdx) => {
    const ch = chapters[chapterIdx];
    setLoadingChapter(chapterIdx);
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'ebook-chapter',
          payload: {
            bookTitle: title,
            chapterTitle: ch.title,
            chapterSummary: ch.summary,
            sections: ch.sections,
            style,
            audience,
            chapterNumber: chapterIdx + 1,
            totalChapters: chapters.length,
          }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setChapters(prev => prev.map((c, i) =>
        i === chapterIdx ? { ...c, content: data.result || '', generated: true } : c
      ));
      toast.success(`เขียนบทที่ ${chapterIdx + 1} สำเร็จ!`);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoadingChapter(null);
    }
  };

  const generateAllChapters = async () => {
    for (let i = 0; i < chapters.length; i++) {
      if (!chapters[i].generated) {
        await generateChapterContent(i);
      }
    }
    toast.success('เขียนครบทุกบทแล้ว!');
  };

  const updateChapter = (idx, field, value) => {
    setChapters(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const moveChapter = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= chapters.length) return;
    setChapters(prev => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const removeChapter = (idx) => {
    setChapters(prev => prev.filter((_, i) => i !== idx));
  };

  const addChapter = () => {
    setChapters(prev => [...prev, {
      id: Date.now(),
      title: `บทที่ ${prev.length + 1}`,
      summary: '',
      sections: [],
      content: '',
      generated: false,
    }]);
  };

  const exportHTML = () => {
    if (!chapters.length) return toast.error('ยังไม่มีเนื้อหา');
    const generatedCount = chapters.filter(c => c.generated).length;
    if (generatedCount === 0) return toast.error('กรุณาสร้างเนื้อหาอย่างน้อย 1 บทก่อน');

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Kanit', sans-serif; color: #1e293b; line-height: 1.8; background: #fff; }
.cover { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, ${CI.cyan} 0%, ${CI.magenta} 100%); color: #fff; text-align: center; padding: 48px; page-break-after: always; }
.cover h1 { font-size: 48px; font-weight: 800; margin-bottom: 16px; }
.cover .subtitle { font-size: 22px; opacity: 0.9; }
.cover .meta { margin-top: 32px; font-size: 16px; opacity: 0.7; }
.toc { padding: 48px; max-width: 800px; margin: 0 auto; page-break-after: always; }
.toc h2 { font-size: 28px; font-weight: 700; margin-bottom: 24px; color: ${CI.cyan}; }
.toc-item { display: flex; align-items: baseline; gap: 8px; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
.toc-item .num { font-weight: 700; color: ${CI.cyan}; min-width: 40px; }
.toc-item .title { font-size: 18px; }
.chapter { padding: 48px; max-width: 800px; margin: 0 auto; page-break-before: always; }
.chapter h2 { font-size: 32px; font-weight: 700; color: ${CI.dark}; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 3px solid ${CI.cyan}; }
.chapter .content { font-size: 17px; white-space: pre-wrap; }
.chapter .content h3 { font-size: 22px; font-weight: 600; color: ${CI.purple}; margin: 24px 0 12px; }
.footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; border-top: 1px solid #e2e8f0; margin-top: 48px; }
@media print { .cover { page-break-after: always; } .chapter { page-break-before: always; } }
</style>
</head>
<body>
<div class="cover">
  <h1>${title}</h1>
  <div class="subtitle">${topic}</div>
  <div class="meta">สร้างโดย SPUBUS Teacher Support Platform<br>${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>
<div class="toc">
  <h2>สารบัญ</h2>
  ${chapters.map((ch, i) => `<div class="toc-item"><span class="num">${i + 1}.</span><span class="title">${ch.title}</span></div>`).join('\n  ')}
</div>
${chapters.filter(c => c.generated).map((ch, i) => `<div class="chapter">
  <h2>บทที่ ${i + 1}: ${ch.title}</h2>
  <div class="content">${ch.content}</div>
</div>`).join('\n')}
<div class="footer">สร้างด้วย SPUBUS E-book Builder &mdash; ${new Date().toLocaleDateString('th-TH')}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'ebook'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลด E-book สำเร็จ!');
  };

  const printPDF = () => {
    if (!chapters.some(c => c.generated)) return toast.error('กรุณาสร้างเนื้อหาก่อน');
    setPreviewMode(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const generatedCount = chapters.filter(c => c.generated).length;

  // ===== PREVIEW MODE =====
  if (previewMode) {
    return (
      <div ref={previewRef} style={{ fontFamily: FONT, background: '#fff' }}>
        {/* Back button (hidden when printing) */}
        <div className="no-print" style={{ padding: '16px', textAlign: 'center' }}>
          <button onClick={() => setPreviewMode(false)} style={{
            padding: '10px 24px', borderRadius: '10px', border: 'none',
            background: CI.cyan, color: '#fff', fontSize: '16px', fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT,
          }}>
            ← กลับไปแก้ไข
          </button>
        </div>

        {/* Cover */}
        <div style={{
          minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${CI.cyan} 0%, ${CI.magenta} 100%)`,
          color: '#fff', textAlign: 'center', padding: '48px', borderRadius: '20px', margin: '20px',
        }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '12px' }}>{title}</h1>
          <p style={{ fontSize: '20px', opacity: 0.9 }}>{topic}</p>
          <p style={{ marginTop: '24px', opacity: 0.7 }}>
            SPUBUS Teacher Support Platform<br />
            {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* TOC */}
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: CI.cyan, marginBottom: '20px' }}>สารบัญ</h2>
          {chapters.map((ch, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ fontWeight: 700, color: CI.cyan, minWidth: '40px' }}>{i + 1}.</span>
              <span style={{ fontSize: '18px' }}>{ch.title}</span>
            </div>
          ))}
        </div>

        {/* Chapters */}
        {chapters.filter(c => c.generated).map((ch, i) => (
          <div key={i} style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', pageBreakBefore: 'always' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: CI.dark, paddingBottom: '12px', borderBottom: `3px solid ${CI.cyan}`, marginBottom: '20px' }}>
              บทที่ {i + 1}: {ch.title}
            </h2>
            <div style={{ fontSize: '17px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ch.content}</div>
          </div>
        ))}
      </div>
    );
  }

  // ===== MAIN UI =====
  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${CI.purple}15, ${CI.cyan}10)`,
        borderRadius: '16px', padding: '24px', marginBottom: '24px',
        border: `1px solid ${CI.purple}20`,
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
          📖 E-book Builder
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
          สร้าง E-book จากหัวข้อ — AI ช่วยวาง Outline + เขียนเนื้อหาแต่ละบท แก้ไขได้ทุกจุด
        </p>
      </div>

      {chapters.length === 0 ? (
        /* ===== SETUP FORM ===== */
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
            ✨ ตั้งค่า E-book
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={lbl}>หัวข้อ / เนื้อหาหลัก *</label>
              <textarea
                placeholder="เช่น การตลาดดิจิทัลสำหรับธุรกิจ SME, พื้นฐาน Machine Learning..."
                value={topic} onChange={e => setTopic(e.target.value)}
                style={{ ...inp, minHeight: '80px', resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>

            <div>
              <label style={lbl}>ชื่อ E-book (ไม่บังคับ — AI จะตั้งให้)</label>
              <input placeholder="เช่น คู่มือการตลาดดิจิทัล 2025" value={title} onChange={e => setTitle(e.target.value)} style={inp} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={lbl}>กลุ่มเป้าหมาย</label>
                <select value={audience} onChange={e => setAudience(e.target.value)} style={inp}>
                  <option>นักศึกษาปริญญาตรี</option>
                  <option>นักศึกษาปริญญาโท</option>
                  <option>บุคคลทั่วไป</option>
                  <option>ผู้เริ่มต้น</option>
                  <option>ผู้มีพื้นฐาน</option>
                </select>
              </div>
              <div>
                <label style={lbl}>จำนวนบท</label>
                <select value={numChapters} onChange={e => setNumChapters(parseInt(e.target.value))} style={inp}>
                  {[3, 4, 5, 6, 7, 8, 10].map(n => <option key={n} value={n}>{n} บท</option>)}
                </select>
              </div>
            </div>

            {/* Style selector */}
            <div>
              <label style={lbl}>สไตล์การเขียน</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)} style={{
                    padding: '14px', borderRadius: '12px', border: `2px solid ${style === s.id ? CI.cyan : '#e2e8f0'}`,
                    background: style === s.id ? `${CI.cyan}08` : '#fff', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{s.icon}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{s.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generateOutline} disabled={loading} style={{
              padding: '14px', borderRadius: '12px', border: 'none',
              background: loading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', fontSize: '18px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginTop: '8px',
            }}>
              {loading ? '⏳ AI กำลังสร้าง Outline...' : '✨ สร้าง Outline ด้วย AI'}
            </button>
          </div>
        </div>
      ) : (
        /* ===== OUTLINE + CONTENT EDITOR ===== */
        <div>
          {/* Book info bar */}
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '16px 20px',
            border: '1px solid #e2e8f0', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{
                ...inp, fontSize: '20px', fontWeight: 700, border: 'none', padding: '4px 0',
              }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', background: `${CI.cyan}15`, color: CI.cyan, fontSize: '14px', fontWeight: 600 }}>
                {chapters.length} บท
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '20px', background: generatedCount === chapters.length ? '#dcfce7' : '#fef3c7', color: generatedCount === chapters.length ? '#16a34a' : '#d97706', fontSize: '14px', fontWeight: 600 }}>
                {generatedCount}/{chapters.length} เขียนแล้ว
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={generateAllChapters} disabled={loadingChapter !== null} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
              color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ✨ เขียนทุกบทที่เหลือ
            </button>
            <button onClick={addChapter} style={{
              padding: '10px 20px', borderRadius: '10px', border: `1px solid ${CI.cyan}`,
              background: '#fff', color: CI.cyan, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + เพิ่มบท
            </button>
            <button onClick={() => setPreviewMode(true)} disabled={generatedCount === 0} style={{
              padding: '10px 20px', borderRadius: '10px', border: `1px solid ${CI.purple}`,
              background: '#fff', color: CI.purple, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              opacity: generatedCount === 0 ? 0.5 : 1,
            }}>
              👁️ Preview
            </button>
            <button onClick={exportHTML} disabled={generatedCount === 0} style={{
              padding: '10px 20px', borderRadius: '10px', border: `1px solid ${CI.magenta}`,
              background: '#fff', color: CI.magenta, fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              opacity: generatedCount === 0 ? 0.5 : 1,
            }}>
              📥 Export HTML
            </button>
            <button onClick={printPDF} disabled={generatedCount === 0} style={{
              padding: '10px 20px', borderRadius: '10px', border: '1px solid #374151',
              background: '#fff', color: '#374151', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              opacity: generatedCount === 0 ? 0.5 : 1,
            }}>
              🖨️ Print/PDF
            </button>
            <button onClick={() => { setChapters([]); setTitle(''); }} style={{
              padding: '10px 20px', borderRadius: '10px', border: '1px solid #ef4444',
              background: '#fff', color: '#ef4444', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              marginLeft: 'auto',
            }}>
              🗑️ เริ่มใหม่
            </button>
          </div>

          {/* Chapters list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {chapters.map((ch, i) => (
              <div key={ch.id || i} style={{
                background: '#fff', borderRadius: '14px',
                border: `1px solid ${ch.generated ? '#86efac' : '#e2e8f0'}`,
                overflow: 'hidden',
              }}>
                {/* Chapter header */}
                <div style={{
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                  background: ch.generated ? '#f0fdf4' : '#f8fafc',
                  borderBottom: editingChapter === i ? '1px solid #e2e8f0' : 'none',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: ch.generated ? '#dcfce7' : `${CI.cyan}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 800, color: ch.generated ? '#16a34a' : CI.cyan,
                    flexShrink: 0,
                  }}>
                    {ch.generated ? '✓' : i + 1}
                  </div>

                  {editingChapter === i ? (
                    <input value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)}
                      onBlur={() => setEditingChapter(null)} onKeyDown={e => e.key === 'Enter' && setEditingChapter(null)}
                      autoFocus style={{ ...inp, flex: 1, fontWeight: 700 }} />
                  ) : (
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditingChapter(i)}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b' }}>
                        บทที่ {i + 1}: {ch.title}
                      </div>
                      {ch.summary && <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>{ch.summary}</div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button onClick={() => moveChapter(i, -1)} disabled={i === 0} style={iconBtn}>↑</button>
                    <button onClick={() => moveChapter(i, 1)} disabled={i === chapters.length - 1} style={iconBtn}>↓</button>
                    {!ch.generated ? (
                      <button onClick={() => generateChapterContent(i)} disabled={loadingChapter !== null} style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none',
                        background: loadingChapter === i ? '#94a3b8' : CI.cyan, color: '#fff',
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {loadingChapter === i ? '⏳' : '✨ เขียน'}
                      </button>
                    ) : (
                      <button onClick={() => setActiveChapter(activeChapter === i ? -1 : i)} style={{
                        padding: '6px 14px', borderRadius: '8px', border: `1px solid ${CI.purple}`,
                        background: '#fff', color: CI.purple,
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        {activeChapter === i ? '▲ ซ่อน' : '▼ ดู/แก้ไข'}
                      </button>
                    )}
                    <button onClick={() => removeChapter(i)} style={{ ...iconBtn, color: '#ef4444' }}>✕</button>
                  </div>
                </div>

                {/* Chapter content (expanded) */}
                {ch.generated && activeChapter === i && (
                  <div style={{ padding: '20px' }}>
                    <textarea
                      value={ch.content}
                      onChange={e => updateChapter(i, 'content', e.target.value)}
                      style={{
                        ...inp, minHeight: '400px', resize: 'vertical', lineHeight: 1.8,
                        fontSize: '16px', fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => generateChapterContent(i)} disabled={loadingChapter !== null} style={{
                        padding: '8px 16px', borderRadius: '8px', border: `1px solid ${CI.cyan}`,
                        background: '#fff', color: CI.cyan, fontSize: '14px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        🔄 สร้างใหม่
                      </button>
                      <span style={{ fontSize: '14px', color: '#94a3b8', alignSelf: 'center' }}>
                        {ch.content.length.toLocaleString()} ตัวอักษร
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: '32px', height: '32px', borderRadius: '8px',
  border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
  fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
