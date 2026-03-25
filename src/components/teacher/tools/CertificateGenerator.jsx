'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function CertificateGenerator() {
  const [form, setForm] = useState({
    title: 'ใบประกาศนียบัตร',
    subtitle: 'Certificate of Achievement',
    body: 'ขอมอบให้แก่',
    name: '',
    achievement: '',
    date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
    signatureName: '',
    signatureTitle: '',
    orgName: 'คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม',
    bgColor: '#0b0b24',
    accentColor: '#ffc107',
  });
  const [csvInput, setCsvInput] = useState('');
  const [batchNames, setBatchNames] = useState([]);
  const [mode, setMode] = useState('single');
  const canvasRef = useRef(null);

  const drawCertificate = (recipientName) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = form.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    // Corner ornaments
    [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]].forEach(([x, y]) => {
      ctx.fillStyle = form.accentColor;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Title
    ctx.fillStyle = form.accentColor;
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText(form.title, W / 2, 120);

    // Subtitle
    ctx.fillStyle = '#e0e0e0';
    ctx.font = 'italic 22px serif';
    ctx.fillText(form.subtitle, W / 2, 155);

    // Divider
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 175); ctx.lineTo(W - 100, 175); ctx.stroke();

    // Body text
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '20px serif';
    ctx.fillText(form.body, W / 2, 220);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px serif';
    ctx.fillText(recipientName || form.name || 'ชื่อผู้รับ', W / 2, 285);

    // Achievement
    if (form.achievement) {
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '18px serif';
      const words = form.achievement.split(' ');
      let line = ''; let y = 325;
      words.forEach(word => {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > W - 200 && line) {
          ctx.fillText(line, W / 2, y); line = word + ' '; y += 26;
        } else line = test;
      });
      if (line) ctx.fillText(line, W / 2, y);
    }

    // Bottom divider
    ctx.strokeStyle = form.accentColor;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, H - 130); ctx.lineTo(W - 100, H - 130); ctx.stroke();

    // Date and org
    ctx.fillStyle = '#d4d4d4';
    ctx.font = '16px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`วันที่: ${form.date}`, 80, H - 100);
    if (form.orgName) {
      ctx.textAlign = 'right';
      ctx.fillText(form.orgName, W - 80, H - 100);
    }

    // Signature
    ctx.textAlign = 'center';
    if (form.signatureName) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px serif';
      ctx.fillText(form.signatureName, W / 2, H - 60);
      ctx.fillStyle = '#d4d4d4';
      ctx.font = '14px serif';
      ctx.fillText(form.signatureTitle, W / 2, H - 40);
    }
  };

  const previewSingle = () => {
    setTimeout(() => drawCertificate(form.name), 50);
    toast.success('ดูตัวอย่างแล้ว');
  };

  const downloadPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      drawCertificate(form.name);
      setTimeout(() => {
        const imgData = canvasRef.current.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'px', [canvasRef.current.width, canvasRef.current.height]);
        pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
        pdf.save(`certificate_${form.name || 'cert'}.pdf`);
        toast.success('ดาวน์โหลด PDF แล้ว');
      }, 100);
    });
  };

  const downloadPNG = () => {
    drawCertificate(form.name);
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `certificate_${form.name || 'cert'}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      toast.success('ดาวน์โหลด PNG แล้ว');
    }, 100);
  };

  const downloadJPG = () => {
    drawCertificate(form.name);
    setTimeout(() => {
      const canvas = canvasRef.current;
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width; offscreen.height = canvas.height;
      const ctx = offscreen.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      ctx.drawImage(canvas, 0, 0);
      const link = document.createElement('a');
      link.download = `certificate_${form.name || 'cert'}.jpg`;
      link.href = offscreen.toDataURL('image/jpeg', 0.95);
      link.click();
      toast.success('ดาวน์โหลด JPG แล้ว');
    }, 100);
  };

  const parseCsv = () => {
    const names = csvInput.split('\n').map(l => l.trim()).filter(Boolean);
    setBatchNames(names);
    toast.success(`พบ ${names.length} รายชื่อ`);
  };

  const downloadBatchZip = async () => {
    if (batchNames.length === 0) { toast.error('กรุณา Parse CSV ก่อน'); return; }
    toast('กำลัง Generate... อาจใช้เวลาสักครู่');
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('landscape', 'px', [canvasRef.current.width, canvasRef.current.height]);
      for (let i = 0; i < batchNames.length; i++) {
        drawCertificate(batchNames[i]);
        await new Promise(r => setTimeout(r, 50));
        const imgData = canvasRef.current.toDataURL('image/png');
        if (i > 0) pdf.addPage([canvasRef.current.width, canvasRef.current.height], 'landscape');
        pdf.addImage(imgData, 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      pdf.save('certificates_batch.pdf');
      toast.success(`สร้าง ${batchNames.length} ใบแล้ว!`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'single', label: '🏆 ออกแบบทีละใบ' }, { id: 'batch', label: '📋 Batch Import (หลายคน)' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#fff' : 'none',
            color: mode === m.id ? CI.purple : '#64748b',
            fontWeight: mode === m.id ? 700 : 400, fontSize: '16px', fontFamily: 'inherit',
            boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>{m.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>🎨 ออกแบบใบประกาศ</h4>
            {[
              { key: 'title', label: 'หัวข้อหลัก' },
              { key: 'subtitle', label: 'หัวข้อรอง' },
              { key: 'body', label: 'ข้อความนำ' },
              { key: 'name', label: 'ชื่อผู้รับ', placeholder: 'นาย/นางสาว...' },
              { key: 'achievement', label: 'เรื่อง/รางวัล', placeholder: 'ผ่านการฝึกอบรม...' },
              { key: 'date', label: 'วันที่' },
              { key: 'signatureName', label: 'ลงนาม' },
              { key: 'signatureTitle', label: 'ตำแหน่ง' },
              { key: 'orgName', label: 'หน่วยงาน' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1e293b',
                }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>สีพื้นหลัง</label>
                <input type="color" value={form.bgColor} onChange={e => setForm(v => ({ ...v, bgColor: e.target.value }))} style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>สีลวดลาย</label>
                <input type="color" value={form.accentColor} onChange={e => setForm(v => ({ ...v, accentColor: e.target.value }))} style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={previewSingle} style={{
              padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '16px',
              fontFamily: 'inherit', fontWeight: 600,
            }}>👁 ดูตัวอย่าง</button>
            <DownloadDropdown
              options={[
                { label: 'PDF (แนะนำ)', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: downloadPDF },
                { label: 'PNG', icon: '🖼️', ext: 'PNG', color: '#2563eb', onClick: downloadPNG },
                { label: 'JPG', icon: '📷', ext: 'JPG', color: '#0369a1', onClick: downloadJPG },
              ]}
            />
          </div>

          {/* Batch mode */}
          {mode === 'batch' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '17px', color: '#1e293b', fontWeight: 700 }}>📋 Batch Import</h4>
              <textarea
                placeholder={'วางรายชื่อ 1 คน/บรรทัด:\nนายสมชาย ใจดี\nนางสาวสมหญิง รักเรียน'}
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                style={{
                  width: '100%', minHeight: '120px', padding: '12px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', fontSize: '15px', resize: 'vertical',
                  fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={parseCsv} style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0',
                  background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit',
                }}>Parse ({batchNames.length} คน)</button>
                <button onClick={downloadBatchZip} style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: CI.magenta, color: '#fff', cursor: 'pointer', fontSize: '15px',
                  fontFamily: 'inherit', fontWeight: 700,
                }}>⬇️ PDF ทั้งหมด</button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas Preview */}
        <div style={{
          background: CI.dark, borderRadius: '16px', padding: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px',
        }}>
          <canvas ref={canvasRef} width={800} height={560} style={{ maxWidth: '100%', borderRadius: '10px', display: 'block' }} />
        </div>
      </div>
    </div>
  );
}
