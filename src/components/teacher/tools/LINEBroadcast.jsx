'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const STORAGE_KEY = 'line-broadcast-templates';

const TEMPLATE_CATS = [
  { key: 'general', label: 'ประกาศทั่วไป', icon: '📢' },
  { key: 'change', label: 'เปลี่ยนห้อง/เวลา', icon: '🔄' },
  { key: 'assignment', label: 'งานที่ได้รับมอบหมาย', icon: '📝' },
  { key: 'exam', label: 'เตือนสอบ', icon: '📋' },
];

const BUILT_IN_TEMPLATES = [
  {
    category: 'general',
    title: 'ประกาศทั่วไป',
    content: '📢 ประกาศจากวิชา [ชื่อวิชา]\n\nเรียนนักศึกษาทุกคน\n[รายละเอียด]\n\n📅 วันที่: [วันที่]\nหากมีข้อสงสัย สอบถามได้ค่ะ/ครับ 🙏',
    placeholders: ['ชื่อวิชา', 'รายละเอียด', 'วันที่'],
  },
  {
    category: 'change',
    title: 'แจ้งเปลี่ยนห้องเรียน',
    content: '🏫 แจ้งเปลี่ยนห้องเรียน\n\n📚 วิชา: [ชื่อวิชา]\n📅 วันที่: [วันที่]\n❌ ห้องเดิม: [ห้องเดิม]\n✅ ห้องใหม่: [ห้องใหม่]\n\nกรุณาไปห้องใหม่ตามที่แจ้งนะคะ/ครับ 🙏',
    placeholders: ['ชื่อวิชา', 'วันที่', 'ห้องเดิม', 'ห้องใหม่'],
  },
  {
    category: 'change',
    title: 'แจ้งเปลี่ยนเวลาเรียน',
    content: '⏰ แจ้งเปลี่ยนเวลาเรียน\n\n📚 วิชา: [ชื่อวิชา]\n📅 วันที่: [วันที่]\n❌ เวลาเดิม: [เวลาเดิม]\n✅ เวลาใหม่: [เวลาใหม่]\n🏫 ห้อง: [ห้อง]\n\nกรุณามาตามเวลาใหม่นะคะ/ครับ 🙏',
    placeholders: ['ชื่อวิชา', 'วันที่', 'เวลาเดิม', 'เวลาใหม่', 'ห้อง'],
  },
  {
    category: 'assignment',
    title: 'แจ้งงานที่ได้รับมอบหมาย',
    content: '📝 แจ้งงาน/การบ้าน\n\n📚 วิชา: [ชื่อวิชา]\n📋 งาน: [ชื่องาน]\n⏰ กำหนดส่ง: [วันที่]\n\n📌 รายละเอียด:\n[รายละเอียด]\n\nส่งงานตรงเวลานะคะ/ครับ 📮',
    placeholders: ['ชื่อวิชา', 'ชื่องาน', 'วันที่', 'รายละเอียด'],
  },
  {
    category: 'exam',
    title: 'เตือนสอบกลางภาค/ปลายภาค',
    content: '📋 แจ้งกำหนดการสอบ\n\n📚 วิชา: [ชื่อวิชา]\n📝 ประเภท: [ประเภทสอบ]\n📅 วันที่: [วันที่]\n⏰ เวลา: [เวลา]\n🏫 ห้อง: [ห้อง]\n\n📖 เนื้อหาที่สอบ:\n[เนื้อหา]\n\nเตรียมตัวให้พร้อม สู้ๆ นะคะ/ครับ 💪',
    placeholders: ['ชื่อวิชา', 'ประเภทสอบ', 'วันที่', 'เวลา', 'ห้อง', 'เนื้อหา'],
  },
  {
    category: 'exam',
    title: 'เตือนสอบย่อย (Quiz)',
    content: '⚡ แจ้งสอบย่อย (Quiz)\n\n📚 วิชา: [ชื่อวิชา]\n📅 วันที่: [วันที่]\n📖 เนื้อหา: [เนื้อหา]\n\nเตรียมตัวมาให้พร้อมนะคะ/ครับ 📚✨',
    placeholders: ['ชื่อวิชา', 'วันที่', 'เนื้อหา'],
  },
];

export default function LINEBroadcast() {
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [preview, setPreview] = useState('');
  const [previewMode, setPreviewMode] = useState('line'); // 'line' or 'email'
  const [filterCat, setFilterCat] = useState('all');
  const [customForm, setCustomForm] = useState({ title: '', content: '', category: 'general' });
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setCustomTemplates(JSON.parse(s)); } catch {}
  }, []);

  const saveCustom = (t) => { setCustomTemplates(t); localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); };

  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates.map(t => ({ ...t, isCustom: true }))];
  const filteredTemplates = filterCat === 'all' ? allTemplates : allTemplates.filter(t => t.category === filterCat);

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setPlaceholderValues({});
    setPreview('');
  };

  const extractPlaceholders = (content) => {
    const matches = content.match(/\[([^\]]+)\]/g) || [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  };

  const generatePreview = () => {
    if (!selectedTemplate) { toast.error('กรุณาเลือก Template'); return; }
    let text = selectedTemplate.content;
    const placeholders = selectedTemplate.placeholders || extractPlaceholders(selectedTemplate.content);
    placeholders.forEach(p => {
      const val = placeholderValues[p] || `[${p}]`;
      text = text.replace(new RegExp(`\\[${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), val);
    });
    setPreview(text);
    toast.success('สร้างข้อความสำเร็จ');
  };

  const copyText = () => {
    if (!preview) return;
    if (previewMode === 'email') {
      const emailText = `เรียน นักศึกษาทุกคน\n\n${preview.replace(/[📢🏫🔄📝📋⚡📚📅❌✅📌📖⏰💪📮✨🙏🤝]/g, '').trim()}\n\nด้วยความเคารพ\nอาจารย์ผู้สอน`;
      navigator.clipboard.writeText(emailText);
    } else {
      navigator.clipboard.writeText(preview);
    }
    toast.success('คัดลอกข้อความแล้ว');
  };

  const saveCustomTemplate = () => {
    if (!customForm.title.trim() || !customForm.content.trim()) { toast.error('กรุณาระบุชื่อและเนื้อหา'); return; }
    const placeholders = extractPlaceholders(customForm.content);
    const tpl = { ...customForm, placeholders, id: Date.now() };
    saveCustom([tpl, ...customTemplates]);
    setCustomForm({ title: '', content: '', category: 'general' });
    setShowCustomForm(false);
    toast.success('บันทึก Template แล้ว');
  };

  const deleteCustomTemplate = (id) => {
    saveCustom(customTemplates.filter(t => t.id !== id));
    toast.success('ลบ Template แล้ว');
  };

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, fontWeight: 600,
  });
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const cardStyle = { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' };

  const currentPlaceholders = selectedTemplate ? (selectedTemplate.placeholders || extractPlaceholders(selectedTemplate.content)) : [];

  return (
    <div style={{ fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>💬 เขียน Template ประกาศ (LINE/Email)</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>เลือก Template กรอกข้อมูล แล้วคัดลอกไปส่งได้เลย</p>

      {/* Category Filter & Custom */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'ทั้งหมด', icon: '📌' }, ...TEMPLATE_CATS].map(c => (
          <button key={c.key} onClick={() => setFilterCat(c.key)}
            style={{ ...btnStyle(filterCat === c.key ? CI.cyan : '#ccc'), padding: '8px 16px', fontSize: 14 }}>
            {c.icon} {c.label}
          </button>
        ))}
        <button style={btnStyle(`linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`)} onClick={() => setShowCustomForm(!showCustomForm)}>
          ➕ Template ของฉัน
        </button>
      </div>

      {/* Custom Template Form */}
      {showCustomForm && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, color: CI.dark, marginTop: 0 }}>สร้าง Template ใหม่</h3>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>ใส่ [ชื่อตัวแปร] ในเนื้อหาเพื่อสร้าง placeholder เช่น [ชื่อวิชา] [วันที่]</p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <input style={inputStyle} placeholder="ชื่อ Template" value={customForm.title} onChange={e => setCustomForm(f => ({ ...f, title: e.target.value }))} />
            <select style={inputStyle} value={customForm.category} onChange={e => setCustomForm(f => ({ ...f, category: e.target.value }))}>
              {TEMPLATE_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical', marginBottom: 10 }} placeholder="เนื้อหา Template พร้อม [placeholder]..."
            value={customForm.content} onChange={e => setCustomForm(f => ({ ...f, content: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle()} onClick={saveCustomTemplate}>💾 บันทึก</button>
            <button style={btnStyle('#888')} onClick={() => setShowCustomForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        {filteredTemplates.map((t, i) => {
          const catInfo = TEMPLATE_CATS.find(c => c.key === t.category);
          const isSelected = selectedTemplate === t;
          return (
            <div key={t.id || i} onClick={() => selectTemplate(t)}
              style={{
                ...cardStyle, cursor: 'pointer', padding: 16, transition: 'all .2s', position: 'relative',
                border: isSelected ? `2px solid ${CI.cyan}` : '2px solid transparent',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{catInfo?.icon || '📄'}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: CI.dark }}>{t.title}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{catInfo?.label || t.category}</div>
              {t.isCustom && (
                <button onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(t.id); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 14 }}>✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Fill Placeholders */}
      {selectedTemplate && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, color: CI.dark, marginTop: 0 }}>📝 กรอกข้อมูล — {selectedTemplate.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
            {currentPlaceholders.map(p => (
              <div key={p}>
                <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 4 }}>{p}</label>
                {(p === 'รายละเอียด' || p === 'เนื้อหา') ? (
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder={p}
                    value={placeholderValues[p] || ''} onChange={e => setPlaceholderValues(v => ({ ...v, [p]: e.target.value }))} />
                ) : (
                  <input style={inputStyle} placeholder={p}
                    value={placeholderValues[p] || ''} onChange={e => setPlaceholderValues(v => ({ ...v, [p]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <button style={{ ...btnStyle('#06c755'), width: '100%', padding: 14, fontSize: 17 }} onClick={generatePreview}>
            ✨ สร้างข้อความ
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={() => setPreviewMode('line')}
              style={{ ...btnStyle(previewMode === 'line' ? '#06c755' : '#ccc'), padding: '8px 18px' }}>
              💬 LINE
            </button>
            <button onClick={() => setPreviewMode('email')}
              style={{ ...btnStyle(previewMode === 'email' ? CI.cyan : '#ccc'), padding: '8px 18px' }}>
              📧 Email
            </button>
            <div style={{ flex: 1 }} />
            <button style={btnStyle(`linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`)} onClick={copyText}>
              📋 คัดลอก
            </button>
          </div>

          {previewMode === 'line' ? (
            <div style={{ background: '#7494A5', borderRadius: 16, padding: 20, maxWidth: 400, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#06c755', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  👩‍🏫
                </div>
                <div style={{
                  background: '#06c755', borderRadius: '18px 18px 18px 4px', padding: '12px 16px',
                  fontSize: 15, color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxWidth: 300,
                  fontFamily: FONT,
                }}>
                  {preview}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#e0e0e0', marginTop: 6 }}>
                {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8f9fa', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
              <div style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#888' }}>Subject:</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: CI.dark }}>[ประกาศ] {selectedTemplate?.title}</div>
              </div>
              <pre style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#333', fontFamily: FONT, margin: 0 }}>
                เรียน นักศึกษาทุกคน{'\n\n'}{preview.replace(/[📢🏫🔄📝📋⚡📚📅❌✅📌📖⏰💪📮✨🙏🤝]/g, '').trim()}{'\n\n'}ด้วยความเคารพ{'\n'}อาจารย์ผู้สอน
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
