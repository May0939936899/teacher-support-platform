'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

export default function QRGenerator() {
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(300);
  const [darkColor, setDarkColor] = useState('#1e293b');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [logo, setLogo] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const generate = async () => {
    if (!url.trim()) {
      toast.error('กรุณากรอก URL');
      return;
    }
    setLoading(true);
    try {
      const QRCode = await import('qrcode');
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 3,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: 'H',
      });

      // Draw logo overlay if set
      if (logo) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.onload = () => {
          const logoSize = size * 0.2;
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;
          ctx.fillStyle = lightColor;
          ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
          ctx.drawImage(img, x, y, logoSize, logoSize);
        };
        img.src = logo;
      }

      setGenerated(true);
      toast.success('สร้าง QR Code แล้ว!');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPNG = () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('ดาวน์โหลด PNG แล้ว');
  };

  const downloadJPG = () => {
    // Draw on white background first (JPG has no alpha)
    const canvas = canvasRef.current;
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'qrcode.jpg';
    link.href = offscreen.toDataURL('image/jpeg', 0.95);
    link.click();
    toast.success('ดาวน์โหลด JPG แล้ว');
  };

  const downloadPDF = async () => {
    const { downloadCanvasAsPDF } = await import('@/lib/teacher/exportUtils');
    await downloadCanvasAsPDF(canvasRef.current, 'qrcode');
    toast.success('ดาวน์โหลด PDF แล้ว');
  };

  const downloadSVG = async () => {
    try {
      const QRCode = await import('qrcode');
      const svgStr = await QRCode.toString(url, {
        type: 'svg',
        width: size,
        margin: 3,
        color: { dark: darkColor, light: lightColor },
      });
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const link = document.createElement('a');
      link.download = 'qrcode.svg';
      link.href = URL.createObjectURL(blob);
      link.click();
      toast.success('ดาวน์โหลด SVG แล้ว');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  // PRESET URLs
  const presets = [
    { label: 'Website', icon: '🌐', example: 'https://example.com' },
    { label: 'LINE', icon: '💚', example: 'https://line.me/ti/g/...' },
    { label: 'Google Form', icon: '📋', example: 'https://forms.gle/...' },
    { label: 'YouTube', icon: '▶️', example: 'https://youtu.be/...' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
        {/* Controls */}
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>🔲 สร้าง QR Code</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>URL หรือข้อความ *</label>
              <input
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>ขนาด (px)</label>
                <input
                  type="range" min="150" max="500" step="50"
                  value={size}
                  onChange={e => setSize(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{size} × {size} px</div>
              </div>
              <div>
                <label style={labelStyle}>สี QR Code</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>สีเข้ม</div>
                    <input type="color" value={darkColor} onChange={e => setDarkColor(e.target.value)}
                      style={{ width: '48px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>พื้นหลัง</div>
                    <input type="color" value={lightColor} onChange={e => setLightColor(e.target.value)}
                      style={{ width: '48px', height: '32px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Logo กลาง (ไม่บังคับ)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload}
                  style={{ fontSize: '12px', flex: 1, color: '#64748b' }} />
                {logo && (
                  <button onClick={() => setLogo(null)}
                    style={{ background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>
                    ✕ ลบ
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                background: loading ? '#94a3b8' : '#2563eb', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '14px',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '⏳ กำลังสร้าง...' : '✨ สร้าง QR Code'}
            </button>
          </div>

          {/* Presets */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>⚡ ตัวอย่าง URL</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => setUrl(p.example)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    background: '#f8fafc', color: '#374151', cursor: 'pointer', fontSize: '12px',
                    fontFamily: 'inherit', display: 'flex', gap: '4px', alignItems: 'center',
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* QR Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '20px', border: '2px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '280px', minHeight: '280px',
          }}>
            {!generated ? (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔲</div>
                <div style={{ fontSize: '13px' }}>QR จะแสดงที่นี่</div>
              </div>
            ) : null}
            <canvas
              ref={canvasRef}
              style={{ borderRadius: '8px', display: generated ? 'block' : 'none' }}
            />
          </div>

          {generated && (
            <DownloadDropdown
              style={{ width: '100%' }}
              btnStyle={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              options={[
                { label: 'PNG (แนะนำ)', icon: '🖼️', ext: 'PNG', color: '#2563eb', onClick: downloadPNG },
                { label: 'JPG', icon: '📷', ext: 'JPG', color: '#0369a1', onClick: downloadJPG },
                { label: 'SVG (Vector)', icon: '✏️', ext: 'SVG', color: '#7c3aed', onClick: downloadSVG },
                { label: 'PDF', icon: '📄', ext: 'PDF', color: '#dc2626', onClick: downloadPDF },
              ]}
            />
          )}

          {generated && (
            <button
              onClick={() => { navigator.clipboard.writeText(url); toast.success('คัดลอก URL แล้ว'); }}
              style={{
                width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '12px',
                fontFamily: 'inherit',
              }}
            >
              📋 คัดลอก URL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' };
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
};
