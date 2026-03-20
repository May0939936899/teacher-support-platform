'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const FIELD_TYPES = [
  { type: 'text', label: 'Text Input', icon: '📝' },
  { type: 'textarea', label: 'Textarea', icon: '📄' },
  { type: 'radio', label: 'Radio', icon: '🔘' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'dropdown', label: 'Dropdown', icon: '📋' },
  { type: 'scale', label: 'Scale (1-5)', icon: '📊' },
];

function generateId() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function FormBuilder() {
  const [formTitle, setFormTitle] = useState('แบบฟอร์มใหม่');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState([]);
  const [view, setView] = useState('edit'); // edit | preview
  const [dragIdx, setDragIdx] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [shareLink, setShareLink] = useState('');

  const addField = (type) => {
    const newField = {
      id: generateId(),
      type,
      label: '',
      required: false,
      placeholder: '',
      options: type === 'radio' || type === 'checkbox' || type === 'dropdown' ? ['ตัวเลือก 1', 'ตัวเลือก 2'] : [],
      scaleMin: 1,
      scaleMax: 5,
      scaleMinLabel: 'น้อยที่สุด',
      scaleMaxLabel: 'มากที่สุด',
    };
    setFields(prev => [...prev, newField]);
    setEditingField(newField.id);
    toast.success('เพิ่มฟิลด์แล้ว');
  };

  const updateField = (id, updates) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (editingField === id) setEditingField(null);
    toast.success('ลบฟิลด์แล้ว');
  };

  const moveField = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= fields.length) return;
    const updated = [...fields];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setFields(updated);
  };

  const addOption = (fieldId) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;
      return { ...f, options: [...f.options, `ตัวเลือก ${f.options.length + 1}`] };
    }));
  };

  const updateOption = (fieldId, optIdx, value) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;
      const opts = [...f.options];
      opts[optIdx] = value;
      return { ...f, options: opts };
    }));
  };

  const removeOption = (fieldId, optIdx) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;
      return { ...f, options: f.options.filter((_, i) => i !== optIdx) };
    }));
  };

  const generateLink = () => {
    const mockId = Math.random().toString(36).slice(2, 10);
    const link = `https://spubus.app/forms/${mockId}`;
    setShareLink(link);
    navigator.clipboard.writeText(link);
    toast.success('สร้างลิงก์แชร์แล้ว (คัดลอกแล้ว)');
  };

  const exportJSON = () => {
    const config = { title: formTitle, description: formDesc, fields, createdAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-${formTitle.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ส่งออก JSON สำเร็จ');
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    fontFamily: FONT,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnStyle = (bg) => ({
    padding: '8px 16px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontFamily: FONT,
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 600,
  });

  const renderFieldPreview = (field) => {
    switch (field.type) {
      case 'text':
        return <div style={{ ...inputStyle, opacity: 0.5 }}>{field.placeholder || 'คำตอบ...'}</div>;
      case 'textarea':
        return <div style={{ ...inputStyle, minHeight: 60, opacity: 0.5 }}>{field.placeholder || 'คำตอบยาว...'}</div>;
      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {field.options.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${CI.cyan}`, display: 'inline-block', flexShrink: 0 }} />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {field.options.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${CI.cyan}`, display: 'inline-block', flexShrink: 0 }} />
                {opt}
              </label>
            ))}
          </div>
        );
      case 'dropdown':
        return (
          <select style={{ ...inputStyle }} disabled>
            <option>-- เลือก --</option>
            {field.options.map((opt, i) => <option key={i}>{opt}</option>)}
          </select>
        );
      case 'scale':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              <span>{field.scaleMinLabel}</span>
              <span>{field.scaleMaxLabel}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: field.scaleMax - field.scaleMin + 1 }, (_, i) => (
                <span key={i} style={{
                  width: 36, height: 36, borderRadius: '50%', border: `2px solid ${CI.cyan}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                }}>{field.scaleMin + i}</span>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>📋</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Form Builder
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['edit', 'preview'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            ...btnStyle(view === v ? CI.cyan : 'rgba(255,255,255,0.1)'),
            fontSize: 15, padding: '10px 24px',
          }}>
            {v === 'edit' ? '✏️ แก้ไข' : '👁️ ดูตัวอย่าง'}
          </button>
        ))}
      </div>

      {view === 'edit' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
          {/* Main Editor */}
          <div>
            {/* Form Title & Desc */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="ชื่อแบบฟอร์ม" style={{ ...inputStyle, fontSize: 18, fontWeight: 600, marginBottom: 10 }} />
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="คำอธิบาย (ไม่บังคับ)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Fields */}
            {fields.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
                คลิกประเภทฟิลด์ด้านขวาเพื่อเพิ่ม
              </div>
            )}
            {fields.map((field, idx) => (
              <div key={field.id} style={{
                background: editingField === field.id ? 'rgba(0,180,230,0.08)' : 'rgba(255,255,255,0.05)',
                borderRadius: 14, padding: 18, marginBottom: 12,
                border: `1px solid ${editingField === field.id ? CI.cyan + '44' : 'rgba(255,255,255,0.1)'}`,
              }}>
                {/* Field Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>#{idx + 1}</span>
                    <span style={{ fontSize: 14, background: `${CI.purple}33`, color: CI.purple, padding: '2px 8px', borderRadius: 6 }}>
                      {FIELD_TYPES.find(ft => ft.type === field.type)?.icon} {field.type}
                    </span>
                    {field.required && <span style={{ fontSize: 12, color: CI.magenta }}>*จำเป็น</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveField(idx, idx - 1)} style={{ ...btnStyle('rgba(255,255,255,0.1)'), padding: '4px 8px', fontSize: 14 }}>▲</button>
                    <button onClick={() => moveField(idx, idx + 1)} style={{ ...btnStyle('rgba(255,255,255,0.1)'), padding: '4px 8px', fontSize: 14 }}>▼</button>
                    <button onClick={() => setEditingField(editingField === field.id ? null : field.id)} style={{ ...btnStyle('rgba(255,255,255,0.1)'), padding: '4px 8px', fontSize: 14 }}>⚙️</button>
                    <button onClick={() => removeField(field.id)} style={{ ...btnStyle('rgba(230,0,126,0.2)'), padding: '4px 8px', fontSize: 14, color: CI.magenta }}>✕</button>
                  </div>
                </div>

                {/* Field Settings */}
                {editingField === field.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} placeholder="คำถาม / Label" style={inputStyle} />
                    {(field.type === 'text' || field.type === 'textarea') && (
                      <input value={field.placeholder} onChange={e => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder text" style={inputStyle} />
                    )}
                    {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
                      <div>
                        <label style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>ตัวเลือก</label>
                        {field.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                            <input value={opt} onChange={e => updateOption(field.id, oi, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                            <button onClick={() => removeOption(field.id, oi)} style={{ ...btnStyle('rgba(230,0,126,0.2)'), color: CI.magenta, padding: '6px 10px' }}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => addOption(field.id)} style={{ ...btnStyle(`${CI.cyan}33`), color: CI.cyan, marginTop: 4 }}>+ เพิ่มตัวเลือก</button>
                      </div>
                    )}
                    {field.type === 'scale' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input value={field.scaleMinLabel} onChange={e => updateField(field.id, { scaleMinLabel: e.target.value })} placeholder="Label ต่ำสุด" style={{ ...inputStyle, flex: 1 }} />
                        <input value={field.scaleMaxLabel} onChange={e => updateField(field.id, { scaleMaxLabel: e.target.value })} placeholder="Label สูงสุด" style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, cursor: 'pointer' }}>
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
                      จำเป็นต้องกรอก
                    </label>
                  </div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            {fields.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
                <button onClick={generateLink} style={{ ...btnStyle(`linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`), background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` }}>🔗 สร้างลิงก์แชร์</button>
                <button onClick={exportJSON} style={btnStyle(CI.purple)}>📥 Export JSON</button>
              </div>
            )}
            {shareLink && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,180,230,0.1)', borderRadius: 10, fontSize: 14, wordBreak: 'break-all' }}>
                🔗 {shareLink}
              </div>
            )}
          </div>

          {/* Field Type Sidebar */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content', position: 'sticky', top: 20 }}>
            <h4 style={{ fontSize: 16, margin: '0 0 12px 0', color: CI.gold }}>เพิ่มฟิลด์</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addField(ft.type)} style={{
                  ...btnStyle('rgba(255,255,255,0.08)'),
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  {ft.icon} {ft.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 20, marginTop: 0, marginBottom: 8 }}>{formTitle || 'แบบฟอร์มไม่มีชื่อ'}</h3>
            {formDesc && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>{formDesc}</p>}

            {fields.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>ยังไม่มีฟิลด์</p>}
            {fields.map((field, idx) => (
              <div key={field.id} style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 16, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                  {field.label || `คำถาม ${idx + 1}`}
                  {field.required && <span style={{ color: CI.magenta, marginLeft: 4 }}>*</span>}
                </label>
                {renderFieldPreview(field)}
              </div>
            ))}

            {fields.length > 0 && (
              <button style={{
                padding: '12px 32px',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                color: '#fff', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: 16, cursor: 'pointer', fontWeight: 600, marginTop: 12,
              }}>
                ส่งคำตอบ
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
