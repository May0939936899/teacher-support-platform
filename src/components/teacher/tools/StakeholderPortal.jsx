'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const REPORT_TYPES = [
  { key: 'parent', label: 'ผู้ปกครอง' },
  { key: 'industry', label: 'อุตสาหกรรม' },
  { key: 'admin', label: 'ผู้บริหาร' },
];

const PERIODS = ['ภาคเรียนที่ 1/2568', 'ภาคเรียนที่ 2/2568', 'ภาคเรียนที่ 1/2569', 'ภาคเรียนที่ 2/2569'];

const STORAGE_KEY = 'stakeholder-portal-reports';
const TEMPLATE_KEY = 'stakeholder-portal-templates';

const emptyForm = () => ({
  studentName: '',
  reportType: 'parent',
  period: PERIODS[0],
  attendance: '',
  grades: '',
  behavior: '',
  recommendations: '',
});

export default function StakeholderPortal() {
  const [form, setForm] = useState(emptyForm());
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [generated, setGenerated] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setReports(JSON.parse(saved));
      const savedT = localStorage.getItem(TEMPLATE_KEY);
      if (savedT) setTemplates(JSON.parse(savedT));
    } catch {}
  }, []);

  const saveReports = (r) => { setReports(r); localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); };
  const saveTemplates = (t) => { setTemplates(t); localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t)); };

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const typeLabel = REPORT_TYPES.find(t => t.key === form.reportType)?.label || '';

  const [aiLoading, setAiLoading] = useState(false);

  const generateReport = () => {
    if (!form.studentName.trim()) { toast.error('กรุณาระบุชื่อนักศึกษา'); return; }
    const text = [
      `═══════════════════════════════════════`,
      `  รายงานสรุปส่ง${typeLabel}`,
      `═══════════════════════════════════════`,
      `ชื่อนักศึกษา: ${form.studentName}`,
      `ประเภทรายงาน: ${typeLabel}`,
      `ภาคเรียน: ${form.period}`,
      `วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`,
      ``,
      `── สรุปการเข้าเรียน ──`,
      form.attendance || '(ไม่มีข้อมูล)',
      ``,
      `── ผลการเรียน ──`,
      form.grades || '(ไม่มีข้อมูล)',
      ``,
      `── พฤติกรรม/หมายเหตุ ──`,
      form.behavior || '(ไม่มีข้อมูล)',
      ``,
      `── ข้อเสนอแนะ ──`,
      form.recommendations || '(ไม่มีข้อมูล)',
      ``,
      `═══════════════════════════════════════`,
    ].join('\n');
    setGenerated(text);
    const newReport = { ...form, id: Date.now(), generatedText: text, createdAt: new Date().toISOString() };
    saveReports([newReport, ...reports]);
    toast.success('สร้างรายงานสำเร็จ');
  };

  const generateWithAI = async () => {
    if (!form.studentName.trim()) { toast.error('กรุณาระบุชื่อนักศึกษา'); return; }
    setAiLoading(true);
    const tid = toast.loading('AI กำลังเขียนรายงาน...');
    try {
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'stakeholder_report',
          payload: {
            audience: typeLabel,
            topic: `รายงานสรุปผลนักศึกษา ${form.studentName} ภาคเรียน ${form.period}`,
            data: `การเข้าเรียน: ${form.attendance || 'ไม่ระบุ'}\nผลการเรียน: ${form.grades || 'ไม่ระบุ'}\nพฤติกรรม: ${form.behavior || 'ไม่ระบุ'}\nข้อเสนอแนะ: ${form.recommendations || 'ไม่ระบุ'}`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI error');
      setGenerated(data.result || '');
      const newReport = { ...form, id: Date.now(), generatedText: data.result || '', createdAt: new Date().toISOString() };
      saveReports([newReport, ...reports]);
      toast.success('AI สร้างรายงานสำเร็จ!', { id: tid });
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message, { id: tid });
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generated);
    toast.success('คัดลอกแล้ว');
  };

  const downloadText = () => {
    const blob = new Blob([generated], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${form.studentName}-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดแล้ว');
  };

  const saveAsTemplate = () => {
    if (!templateName.trim()) { toast.error('กรุณาตั้งชื่อ Template'); return; }
    const tpl = { id: Date.now(), name: templateName, form: { ...form, studentName: '' }, createdAt: new Date().toISOString() };
    saveTemplates([tpl, ...templates]);
    setTemplateName('');
    toast.success('บันทึก Template สำเร็จ');
  };

  const loadTemplate = (tpl) => {
    setForm({ ...tpl.form });
    setShowTemplates(false);
    toast.success(`โหลด Template "${tpl.name}" แล้ว`);
  };

  const deleteTemplate = (id) => {
    saveTemplates(templates.filter(t => t.id !== id));
    toast.success('ลบ Template แล้ว');
  };

  const deleteReport = (id) => {
    saveReports(reports.filter(r => r.id !== id));
    toast.success('ลบรายงานแล้ว');
  };

  const btnStyle = (bg) => ({
    padding: '10px 20px', border: 'none', borderRadius: 10, color: '#fff', fontFamily: FONT,
    fontSize: 15, cursor: 'pointer', background: bg || `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
    fontWeight: 600, transition: 'transform .15s',
  });

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid #e0e0e0`,
    fontFamily: FONT, fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };

  const textareaStyle = { ...inputStyle, minHeight: 80, resize: 'vertical' };

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  };

  return (
    <div style={{ fontFamily: FONT, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, color: CI.dark, marginBottom: 4 }}>📊 รายงานสรุปส่งผู้ปกครอง/อุตสาหกรรม</h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 20 }}>สร้างรายงานอย่างเป็นระบบ พร้อมดาวน์โหลดและบันทึก Template</p>

      {/* Template bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={btnStyle(CI.purple)} onClick={() => setShowTemplates(!showTemplates)}>
          📁 Template ({templates.length})
        </button>
        <input placeholder="ชื่อ Template ใหม่..." value={templateName} onChange={e => setTemplateName(e.target.value)}
          style={{ ...inputStyle, width: 200 }} />
        <button style={btnStyle(`linear-gradient(135deg, ${CI.gold}, ${CI.magenta})`)} onClick={saveAsTemplate}>
          💾 บันทึก Template
        </button>
      </div>

      {showTemplates && templates.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 17, color: CI.dark }}>Template ที่บันทึกไว้</h4>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ flex: 1, fontSize: 15 }}>📄 {t.name} <span style={{ color: '#aaa', fontSize: 13 }}>({REPORT_TYPES.find(r => r.key === t.form.reportType)?.label})</span></span>
              <button style={{ ...btnStyle(CI.cyan), padding: '6px 14px', fontSize: 13 }} onClick={() => loadTemplate(t)}>โหลด</button>
              <button style={{ ...btnStyle('#e53935'), padding: '6px 14px', fontSize: 13 }} onClick={() => deleteTemplate(t.id)}>ลบ</button>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>ชื่อนักศึกษา</label>
            <input style={inputStyle} placeholder="ระบุชื่อ-นามสกุล" value={form.studentName} onChange={e => updateField('studentName', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>ประเภทรายงาน</label>
            <select style={inputStyle} value={form.reportType} onChange={e => updateField('reportType', e.target.value)}>
              {REPORT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>ภาคเรียน</label>
            <select style={inputStyle} value={form.period} onChange={e => updateField('period', e.target.value)}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>📋 สรุปการเข้าเรียน</label>
          <textarea style={textareaStyle} placeholder="เช่น เข้าเรียน 40/45 ครั้ง ขาด 3 ครั้ง ลา 2 ครั้ง..." value={form.attendance} onChange={e => updateField('attendance', e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>📝 ผลการเรียน</label>
          <textarea style={textareaStyle} placeholder="เช่น คะแนนเก็บ 75/100 สอบกลางภาค 35/50..." value={form.grades} onChange={e => updateField('grades', e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>🎯 พฤติกรรม/หมายเหตุ</label>
          <textarea style={textareaStyle} placeholder="พฤติกรรมในชั้นเรียน ความรับผิดชอบ..." value={form.behavior} onChange={e => updateField('behavior', e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 15, fontWeight: 600, color: CI.dark, display: 'block', marginBottom: 6 }}>💡 ข้อเสนอแนะ</label>
          <textarea style={textareaStyle} placeholder="คำแนะนำสำหรับการพัฒนา..." value={form.recommendations} onChange={e => updateField('recommendations', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={{ ...btnStyle(), padding: 14, fontSize: 16 }} onClick={generateReport}>
            📄 สร้างรายงาน (แบบฟอร์ม)
          </button>
          <button
            style={{ ...btnStyle(`linear-gradient(135deg, ${CI.purple}, ${CI.magenta})`), padding: 14, fontSize: 16, opacity: aiLoading ? 0.6 : 1 }}
            onClick={generateWithAI}
            disabled={aiLoading}
          >
            {aiLoading ? '⏳ AI กำลังเขียน...' : '✨ AI เขียนรายงานให้'}
          </button>
        </div>
      </div>

      {/* Generated Report */}
      {generated && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: CI.dark, marginTop: 0 }}>📄 รายงานที่สร้าง</h3>
          <pre style={{ background: '#f8f9fa', padding: 16, borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 14, fontFamily: FONT, lineHeight: 1.7 }}>
            {generated}
          </pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={btnStyle(CI.cyan)} onClick={copyToClipboard}>📋 คัดลอก</button>
            <button style={btnStyle(`linear-gradient(135deg, ${CI.magenta}, ${CI.purple})`)} onClick={downloadText}>💾 ดาวน์โหลด .txt</button>
          </div>
        </div>
      )}

      {/* Report History */}
      {reports.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, color: CI.dark, marginTop: 0 }}>📚 ประวัติรายงาน ({reports.length})</h3>
          {reports.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ flex: 1, fontSize: 15 }}>
                {r.studentName} — {REPORT_TYPES.find(t => t.key === r.reportType)?.label} — {r.period}
                <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>{new Date(r.createdAt).toLocaleDateString('th-TH')}</span>
              </span>
              <button style={{ ...btnStyle(CI.cyan), padding: '6px 12px', fontSize: 13 }} onClick={() => { setGenerated(r.generatedText); toast.success('โหลดรายงาน'); }}>ดู</button>
              <button style={{ ...btnStyle('#e53935'), padding: '6px 12px', fontSize: 13 }} onClick={() => deleteReport(r.id)}>ลบ</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
