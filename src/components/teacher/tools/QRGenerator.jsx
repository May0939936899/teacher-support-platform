'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const COLOR_PRESETS = [
  { label: 'Classic', dark: '#1e293b', light: '#ffffff' },
  { label: 'Ocean',   dark: '#0369a1', light: '#e0f2fe' },
  { label: 'Forest',  dark: '#166534', light: '#f0fdf4' },
  { label: 'Grape',   dark: '#6d28d9', light: '#f5f3ff' },
  { label: 'Sunset',  dark: '#9f1239', light: '#fff1f2' },
  { label: 'SPUBUS',  dark: '#0b0b24', light: '#e0f9ff' },
];

const PRESETS = [
  { label: 'Website',     icon: '🌐', example: 'https://example.com',          color: '#2563eb' },
  { label: 'LINE',        icon: '💚', example: 'https://line.me/ti/g/xxxxxx',  color: '#06b35a' },
  { label: 'Google Form', icon: '📋', example: 'https://forms.gle/xxxxxxxx',   color: '#ea4335' },
  { label: 'YouTube',     icon: '▶️', example: 'https://youtu.be/xxxxxxxx',    color: '#ff0000' },
  { label: 'Facebook',    icon: '📘', example: 'https://facebook.com/page',    color: '#1877f2' },
  { label: 'WiFi',        icon: '📶', example: 'WIFI:T:WPA;S:MyNetwork;P:password;;', color: '#0891b2' },
];

export default function QRGenerator() {
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(300);
  const [darkColor, setDarkColor] = useState('#1e293b');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [logo, setLogo] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const canvasRef = useRef(null);
  const logoInputRef = useRef(null);

  const applyColorPreset = (p, idx) => {
    setDarkColor(p.dark);
    setLightColor(p.light);
    setActivePreset(idx);
  };

  const generate = async () => {
    if (!url.trim()) { toast.error('กรุณากรอก URL หรือข้อความ'); return; }
    setLoading(true);
    try {
      const QRCode = await import('qrcode');
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size, margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      });
      if (logo) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
          const s = size * 0.22;
          const x = (size - s) / 2, y = (size - s) / 2;
          ctx.fillStyle = lightColor;
          ctx.beginPath(); ctx.roundRect(x - 6, y - 6, s + 12, s + 12, 8); ctx.fill();
          ctx.drawImage(img, x, y, s, s);
        };
        img.src = logo;
      }
      setGenerated(true);
      toast.success('สร้าง QR Code เรียบร้อย!');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPNG = () => { const a = document.createElement('a'); a.download = 'qrcode.png'; a.href = canvasRef.current.toDataURL('image/png'); a.click(); toast.success('ดาวน์โหลด PNG แล้ว'); };
  const downloadJPG = () => {
    const c = canvasRef.current, o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    const ctx = o.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, o.width, o.height); ctx.drawImage(c, 0, 0);
    const a = document.createElement('a'); a.download = 'qrcode.jpg'; a.href = o.toDataURL('image/jpeg', 0.95); a.click();
    toast.success('ดาวน์โหลด JPG แล้ว');
  };
  const downloadSVG = async () => {
    try {
      const QRCode = await import('qrcode');
      const svgStr = await QRCode.toString(url, { type: 'svg', width: size, margin: 2, color: { dark: darkColor, light: lightColor } });
      const a = document.createElement('a'); a.download = 'qrcode.svg'; a.href = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' })); a.click();
      toast.success('ดาวน์โหลด SVG แล้ว');
    } catch (e) { toast.error(e.message); }
  };
  const downloadPDF = async () => { const { downloadCanvasAsPDF } = await import('@/lib/teacher/exportUtils'); await downloadCanvasAsPDF(canvasRef.current, 'qrcode'); toast.success('ดาวน์โหลด PDF แล้ว'); };

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f5f3ff 50%,#fff0f6 100%)', padding: '0' }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${CI.dark} 0%,#1a1a5e 60%,#2d0a4e 100%)`, padding: '28px 32px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '5%', width: '300px', height: '300px', background: `radial-gradient(circle,${CI.cyan}20 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '10%', width: '200px', height: '200px', background: `radial-gradient(circle,${CI.magenta}15 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg,${CI.cyan},${CI.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: `0 4px 16px ${CI.cyan}40` }}>
              🔲
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '0.01em' }}>QR Code Generator</h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>สร้าง QR Code พร้อมโลโก้ ดาวน์โหลดได้ทันที</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* ===== LEFT PANEL ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* URL Input */}
            <div style={card}>
              <label style={sectionLabel}>🔗 URL หรือข้อความ</label>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="https://example.com หรือข้อความที่ต้องการ"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                  style={{ ...inputStyle, paddingRight: url ? '80px' : '14px', fontSize: '15px', padding: '13px 14px' }}
                />
                {url && (
                  <button onClick={() => setUrl('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                    ✕ ล้าง
                  </button>
                )}
              </div>

              {/* Quick presets */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>ตัวอย่างด่วน</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => { setUrl(p.example); toast(`ตัวอย่าง ${p.label} ถูกเลือกแล้ว`); }}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: `1.5px solid ${p.color}30`, background: `${p.color}08`, color: p.color, cursor: 'pointer', fontSize: '12px', fontFamily: FONT, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customization */}
            <div style={card}>
              <label style={sectionLabel}>🎨 ปรับแต่ง</label>

              {/* Size */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>ขนาด</span>
                  <span style={{ fontSize: '13px', color: CI.cyan, fontWeight: 700 }}>{size} × {size} px</span>
                </div>
                <input type="range" min="150" max="600" step="50" value={size}
                  onChange={e => setSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: CI.cyan, height: '6px', borderRadius: '3px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  <span>150px</span><span>600px</span>
                </div>
              </div>

              {/* Color presets */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600, marginBottom: '10px' }}>ธีมสี</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLOR_PRESETS.map((p, i) => (
                    <button key={p.label} onClick={() => applyColorPreset(p, i)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: `2px solid ${activePreset === i ? CI.cyan : '#e2e8f0'}`, background: activePreset === i ? `${CI.cyan}10` : '#fafafa', cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: p.dark }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: p.light, border: '1px solid #e2e8f0' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: activePreset === i ? CI.cyan : '#64748b', fontWeight: activePreset === i ? 700 : 500 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom colors */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>สีโค้ด</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="color" value={darkColor} onChange={e => { setDarkColor(e.target.value); setActivePreset(-1); }}
                      style={{ width: '40px', height: '36px', borderRadius: '8px', border: '2px solid #e2e8f0', cursor: 'pointer', padding: '2px' }} />
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#475569' }}>{darkColor}</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>พื้นหลัง</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="color" value={lightColor} onChange={e => { setLightColor(e.target.value); setActivePreset(-1); }}
                      style={{ width: '40px', height: '36px', borderRadius: '8px', border: '2px solid #e2e8f0', cursor: 'pointer', padding: '2px' }} />
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#475569' }}>{lightColor}</span>
                  </div>
                </div>
              </div>

              {/* Logo upload */}
              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: `2px dashed ${logo ? CI.cyan : '#e2e8f0'}` }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>🖼️ Logo กลาง QR (ไม่บังคับ)</div>
                {logo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logo} alt="logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <span style={{ fontSize: '12px', color: '#475569', flex: 1 }}>โลโก้พร้อมแล้ว</span>
                    <button onClick={() => setLogo(null)}
                      style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: FONT }}>
                      ✕ ลบ
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontFamily: FONT }}>
                    + เลือกไฟล์รูป
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setLogo(ev.target.result); r.readAsDataURL(f); }} style={{ display: 'none' }} />
              </div>
            </div>

            {/* Generate button */}
            <button onClick={generate} disabled={loading || !url.trim()}
              style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', fontFamily: FONT,
                background: loading || !url.trim() ? '#cbd5e1' : `linear-gradient(135deg,${CI.cyan},${CI.purple})`,
                color: '#fff', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 800, fontSize: '17px', boxShadow: loading || !url.trim() ? 'none' : `0 6px 24px ${CI.cyan}40`,
                transition: 'all 0.2s', letterSpacing: '0.02em' }}>
              {loading ? '⏳ กำลังสร้าง...' : '✨ สร้าง QR Code'}
            </button>
          </div>

          {/* ===== RIGHT PANEL — QR Preview ===== */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div style={{ ...card, padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ตัวอย่าง QR Code</div>

              {/* QR frame */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', padding: '4px',
                background: generated ? `linear-gradient(135deg,${CI.cyan},${CI.purple})` : 'transparent',
                boxShadow: generated ? `0 8px 32px ${CI.cyan}30` : 'none',
                marginBottom: '16px',
              }}>
                <div style={{
                  background: '#fff', borderRadius: '17px', padding: '16px',
                  minWidth: '220px', minHeight: '220px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!generated ? (
                    <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                      <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '12px', filter: 'grayscale(1) opacity(0.3)' }}>🔲</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>QR จะแสดงที่นี่</div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>กรอก URL แล้วกดสร้าง</div>
                    </div>
                  ) : null}
                  <canvas ref={canvasRef} style={{ borderRadius: '10px', display: generated ? 'block' : 'none', maxWidth: '220px', maxHeight: '220px' }} />
                </div>
              </div>

              {generated && url && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', wordBreak: 'break-all', fontSize: '11px', color: '#64748b', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>URL: </span>{url.length > 60 ? url.slice(0, 60) + '…' : url}
                </div>
              )}

              {generated && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <DownloadDropdown
                    btnStyle={{ width: '100%', justifyContent: 'center', padding: '11px', borderRadius: '10px', fontFamily: FONT, fontWeight: 700, fontSize: '14px' }}
                    options={[
                      { label: 'PNG (แนะนำ)', icon: '🖼️', ext: 'PNG', color: '#2563eb', onClick: downloadPNG },
                      { label: 'JPG',         icon: '📷', ext: 'JPG', color: '#0369a1', onClick: downloadJPG },
                      { label: 'SVG (Vector)',icon: '✏️', ext: 'SVG', color: '#7c3aed', onClick: downloadSVG },
                      { label: 'PDF',         icon: '📄', ext: 'PDF', color: '#dc2626', onClick: downloadPDF },
                    ]}
                  />
                  <button onClick={() => { navigator.clipboard.writeText(url); toast.success('คัดลอก URL แล้ว'); }}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontFamily: FONT, fontWeight: 600 }}>
                    📋 คัดลอก URL
                  </button>
                  <button onClick={() => { setGenerated(false); setUrl(''); setLogo(null); setSize(300); setDarkColor('#1e293b'); setLightColor('#ffffff'); setActivePreset(0); }}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #fee2e2', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontFamily: FONT, fontWeight: 600 }}>
                    🔄 สร้างใหม่
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const card = {
  background: '#fff', borderRadius: '16px', padding: '20px',
  border: '1px solid #e8ecf0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
};
const sectionLabel = { fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '14px' };
const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', color: '#1e293b', fontFamily: FONT,
  background: '#fafafa', transition: 'border-color 0.15s',
};
