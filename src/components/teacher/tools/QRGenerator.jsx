'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import DownloadDropdown from './DownloadDropdown';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const COLOR_PRESETS = [
  { label: 'Classic', dark: '#1e293b', light: '#ffffff',  accent: '#1e293b' },
  { label: 'Ocean',   dark: '#0369a1', light: '#e0f2fe',  accent: '#0369a1' },
  { label: 'Forest',  dark: '#166534', light: '#f0fdf4',  accent: '#166534' },
  { label: 'Grape',   dark: '#6d28d9', light: '#f5f3ff',  accent: '#6d28d9' },
  { label: 'Sunset',  dark: '#9f1239', light: '#fff1f2',  accent: '#9f1239' },
  { label: 'SPUBUS',  dark: '#0b0b24', light: '#e0f9ff',  accent: '#00b4e6' },
];

const PRESETS = [
  { label: 'Website',     icon: '🌐', example: 'https://example.com',                   bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  { label: 'LINE',        icon: '💚', example: 'https://line.me/ti/g/xxxxxx',           bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  { label: 'Google Form', icon: '📋', example: 'https://forms.gle/xxxxxxxx',            bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  { label: 'YouTube',     icon: '▶️', example: 'https://youtu.be/xxxxxxxx',             bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  { label: 'Facebook',    icon: '📘', example: 'https://facebook.com/page',             bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  { label: 'WiFi',        icon: '📶', example: 'WIFI:T:WPA;S:MyNetwork;P:mypassword;;', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
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

  const applyColorPreset = (p, idx) => { setDarkColor(p.dark); setLightColor(p.light); setActivePreset(idx); };

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
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const cw = canvas.width, ch = canvas.height;
        const img = new Image();
        img.onload = () => {
          const s = cw * 0.22;
          const x = (cw - s) / 2, y = (ch - s) / 2, pad = 6;
          ctx.fillStyle = lightColor;
          ctx.fillRect(x - pad, y - pad, s + pad * 2, s + pad * 2);
          ctx.drawImage(img, x, y, s, s);
        };
        img.src = logo;
      }
      setGenerated(true);
      toast.success('สร้าง QR Code เรียบร้อย!');
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด: ' + e.message);
    } finally { setLoading(false); }
  };

  const downloadPNG = () => { const a = document.createElement('a'); a.download = 'qrcode.png'; a.href = canvasRef.current.toDataURL('image/png'); a.click(); toast.success('ดาวน์โหลด PNG'); };
  const downloadJPG = () => { const c = canvasRef.current, o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const ctx = o.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,o.width,o.height); ctx.drawImage(c,0,0); const a = document.createElement('a'); a.download='qrcode.jpg'; a.href=o.toDataURL('image/jpeg',0.95); a.click(); toast.success('ดาวน์โหลด JPG'); };
  const downloadSVG = async () => { try { const QRCode = await import('qrcode'); const s = await QRCode.toString(url,{type:'svg',width:size,margin:2,color:{dark:darkColor,light:lightColor}}); const a = document.createElement('a'); a.download='qrcode.svg'; a.href=URL.createObjectURL(new Blob([s],{type:'image/svg+xml'})); a.click(); toast.success('ดาวน์โหลด SVG'); } catch(e){toast.error(e.message);} };
  const downloadPDF = async () => { const {downloadCanvasAsPDF} = await import('@/lib/teacher/exportUtils'); await downloadCanvasAsPDF(canvasRef.current,'qrcode'); toast.success('ดาวน์โหลด PDF'); };

  const activeCP = COLOR_PRESETS[activePreset] || COLOR_PRESETS[0];

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100%' }}>
      <style>{`
        @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.08);opacity:0.15} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .qr-preset-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .qr-gen-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 8px 28px rgba(0,180,230,0.45) !important; }
        .qr-gen-btn:active:not(:disabled) { transform: translateY(0) !important; }
        .qr-color-chip:hover { transform: scale(1.06) !important; }
        .qr-download-action:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* ===== HERO HEADER ===== */}
      <div style={{ background: `linear-gradient(135deg,${CI.dark} 0%,#141452 55%,#1f0a3d 100%)`, padding: '32px 32px 28px', position: 'relative', overflow: 'hidden' }}>
        {/* Blobs */}
        <div style={{ position:'absolute', top:'-60%', right:'8%', width:'380px', height:'380px', borderRadius:'50%', background:`radial-gradient(circle,${CI.cyan}18 0%,transparent 65%)`, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40%', left:'3%', width:'260px', height:'260px', borderRadius:'50%', background:`radial-gradient(circle,${CI.magenta}12 0%,transparent 65%)`, pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'20%', right:'22%', width:'140px', height:'140px', borderRadius:'50%', background:`radial-gradient(circle,${CI.purple}15 0%,transparent 65%)`, pointerEvents:'none' }} />
        {/* Dots */}
        {[...Array(8)].map((_,i) => (
          <div key={i} style={{ position:'absolute', width:'3px', height:'3px', borderRadius:'50%', background: i%2===0?CI.cyan:CI.gold, top:`${(i*17+8)%80}%`, left:`${(i*23+5)%90}%`, opacity: 0.4 }} />
        ))}
        <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:'18px' }}>
          {/* Icon */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ position:'absolute', inset:'-6px', borderRadius:'20px', background:`linear-gradient(135deg,${CI.cyan},${CI.purple})`, opacity:0.25, animation:'pulse-ring 2.5s ease-in-out infinite' }} />
            <div style={{ width:'60px', height:'60px', borderRadius:'18px', background:`linear-gradient(135deg,${CI.cyan} 0%,${CI.purple} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', boxShadow:`0 8px 24px ${CI.cyan}50`, position:'relative' }}>
              🔲
            </div>
          </div>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#fff', letterSpacing:'0.01em' }}>
              QR Code <span style={{ color:CI.cyan }}>Generator</span>
            </h1>
            <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>
              สร้าง QR Code คุณภาพสูง · ใส่โลโก้ · เลือกสี · ดาวน์โหลดได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div style={{ padding: '24px 24px 40px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* URL Card */}
            <div style={card}>
              <div style={cardHeader}>🔗 URL หรือข้อความ</div>
              <div style={{ position:'relative' }}>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                  placeholder="https://example.com หรือข้อความที่ต้องการ..."
                  style={{ width:'100%', padding:'13px 48px 13px 16px', borderRadius:'12px', border:`2px solid ${url ? CI.cyan : '#e2e8f0'}`, fontSize:'15px', outline:'none', boxSizing:'border-box', color:'#1e293b', fontFamily:FONT, background:url?`${CI.cyan}06`:'#fafafa', transition:'all 0.2s' }}
                />
                {url && (
                  <button onClick={() => setUrl('')} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'#f1f5f9', border:'none', borderRadius:'8px', padding:'4px 9px', cursor:'pointer', color:'#94a3b8', fontSize:'13px' }}>✕</button>
                )}
              </div>

              {/* Preset chips */}
              <div style={{ marginTop:'14px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'10px' }}>ตัวอย่างด่วน</div>
                <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                  {PRESETS.map(p => (
                    <button key={p.label} className="qr-preset-btn" onClick={() => { setUrl(p.example); toast(`เลือก ${p.label} แล้ว`); }}
                      style={{ padding:'7px 13px', borderRadius:'20px', border:`1.5px solid ${p.border}`, background:p.bg, color:p.color, cursor:'pointer', fontSize:'12px', fontFamily:FONT, fontWeight:700, display:'flex', alignItems:'center', gap:'5px', transition:'all 0.18s', lineHeight:1 }}>
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Customize Card */}
            <div style={card}>
              <div style={cardHeader}>🎨 ปรับแต่ง QR Code</div>

              {/* Size slider */}
              <div style={{ marginBottom:'22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <span style={{ fontSize:'13px', fontWeight:700, color:'#475569' }}>ขนาด</span>
                  <span style={{ fontSize:'14px', fontWeight:800, color:CI.cyan, background:`${CI.cyan}12`, padding:'2px 10px', borderRadius:'20px' }}>{size} × {size} px</span>
                </div>
                <input type="range" min="150" max="600" step="50" value={size}
                  onChange={e => setSize(parseInt(e.target.value))}
                  style={{ width:'100%', accentColor:CI.cyan, cursor:'pointer' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#cbd5e1', marginTop:'4px' }}>
                  <span>เล็ก 150px</span><span>ใหญ่ 600px</span>
                </div>
              </div>

              {/* Color theme */}
              <div style={{ marginBottom:'18px' }}>
                <div style={{ fontSize:'13px', fontWeight:700, color:'#475569', marginBottom:'12px' }}>ธีมสี</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {COLOR_PRESETS.map((p, i) => (
                    <button key={p.label} className="qr-color-chip"
                      onClick={() => applyColorPreset(p, i)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', padding:'10px 12px', borderRadius:'12px', border:`2px solid ${activePreset === i ? p.accent : '#e2e8f0'}`, background: activePreset === i ? `${p.accent}10` : '#fafafa', cursor:'pointer', transition:'all 0.18s', minWidth:'64px' }}>
                      <div style={{ display:'flex', gap:'3px' }}>
                        <div style={{ width:'18px', height:'18px', borderRadius:'5px', background:p.dark, boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                        <div style={{ width:'18px', height:'18px', borderRadius:'5px', background:p.light, border:'1.5px solid #e2e8f0' }} />
                      </div>
                      <span style={{ fontSize:'11px', fontWeight: activePreset===i?800:600, color: activePreset===i?p.accent:'#94a3b8', lineHeight:1 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom color pickers */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                {[{label:'สีโค้ด', val:darkColor, set:(v)=>{setDarkColor(v);setActivePreset(-1);}},
                  {label:'พื้นหลัง', val:lightColor, set:(v)=>{setLightColor(v);setActivePreset(-1);}}].map(c => (
                  <div key={c.label} style={{ background:'#f8fafc', borderRadius:'12px', padding:'12px 14px', border:'1.5px solid #e8ecf0', display:'flex', alignItems:'center', gap:'10px' }}>
                    <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                      style={{ width:'36px', height:'36px', borderRadius:'8px', border:'2px solid #e2e8f0', cursor:'pointer', padding:'2px', flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:600 }}>{c.label}</div>
                      <div style={{ fontSize:'12px', fontFamily:'monospace', color:'#475569', fontWeight:700 }}>{c.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logo upload */}
              <div style={{ borderRadius:'12px', border:`2px dashed ${logo ? CI.cyan : '#e2e8f0'}`, background: logo?`${CI.cyan}05`:'#fafafa', padding:'14px', transition:'all 0.2s' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'#64748b', marginBottom:'10px' }}>🖼️ โลโก้กลาง QR <span style={{ fontWeight:400, color:'#94a3b8' }}>(ไม่บังคับ)</span></div>
                {logo ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <img src={logo} alt="logo" style={{ width:'44px', height:'44px', objectFit:'contain', borderRadius:'10px', border:`2px solid ${CI.cyan}40`, background:'#fff', padding:'4px' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:CI.cyan }}>โลโก้พร้อมแล้ว</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8' }}>จะแสดงตรงกลาง QR Code</div>
                    </div>
                    <button onClick={() => setLogo(null)} style={{ background:'#fee2e2', border:'none', color:'#dc2626', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'12px', fontFamily:FONT, fontWeight:700 }}>✕ ลบ</button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()}
                    style={{ width:'100%', padding:'10px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:'13px', fontFamily:FONT, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <span style={{ fontSize:'18px' }}>📁</span> คลิกเพื่อเลือกรูปโลโก้
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setLogo(ev.target.result); r.readAsDataURL(f); }} style={{ display:'none' }} />
              </div>
            </div>

            {/* Generate Button */}
            <button className="qr-gen-btn" onClick={generate} disabled={loading || !url.trim()}
              style={{ width:'100%', padding:'17px', borderRadius:'16px', border:'none', fontFamily:FONT,
                background: !url.trim() ? '#e2e8f0' : loading ? `linear-gradient(135deg,${CI.cyan}80,${CI.purple}80)` : `linear-gradient(135deg,${CI.cyan} 0%,${CI.purple} 100%)`,
                color: !url.trim() ? '#94a3b8' : '#fff',
                cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                fontWeight:900, fontSize:'18px', letterSpacing:'0.02em',
                boxShadow: url.trim() && !loading ? `0 6px 20px ${CI.cyan}35` : 'none',
                transition:'all 0.22s' }}>
              {loading ? '⏳ กำลังสร้าง...' : url.trim() ? '✨ สร้าง QR Code' : '← กรอก URL ก่อน'}
            </button>
          </div>

          {/* RIGHT — Preview */}
          <div style={{ position:'sticky', top:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>

            {/* QR Display */}
            <div style={{ background:'#fff', borderRadius:'20px', padding:'24px', border:'1px solid #e8ecf0', boxShadow:'0 4px 24px rgba(0,0,0,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:'11px', fontWeight:800, color:'#94a3b8', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'18px' }}>ตัวอย่าง QR Code</div>

              {/* Frame */}
              <div style={{ display:'inline-flex', padding:'3px', borderRadius:'22px', background: generated ? `linear-gradient(135deg,${CI.cyan},${CI.purple},${CI.magenta})` : '#e8ecf0', marginBottom:'16px', boxShadow: generated ? `0 8px 32px ${CI.cyan}30` : 'none', transition:'all 0.3s' }}>
                <div style={{ background:'#fff', borderRadius:'20px', padding:'18px', minWidth:'210px', minHeight:'210px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {!generated ? (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'56px', lineHeight:1, marginBottom:'10px', animation:'float 3s ease-in-out infinite', display:'block' }}>🔲</div>
                      <div style={{ fontSize:'12px', color:'#cbd5e1', fontWeight:600 }}>QR จะแสดงที่นี่</div>
                    </div>
                  ) : null}
                  <canvas ref={canvasRef} style={{ borderRadius:'12px', display:generated?'block':'none', maxWidth:'210px', maxHeight:'210px' }} />
                </div>
              </div>

              {/* URL badge */}
              {generated && url && (
                <div style={{ background:'linear-gradient(135deg,#f0f9ff,#f5f3ff)', borderRadius:'10px', padding:'8px 12px', marginBottom:'14px', fontSize:'11px', color:'#64748b', wordBreak:'break-all', textAlign:'left', border:'1px solid #e2e8f0' }}>
                  <span style={{ fontWeight:700, color:'#475569' }}>🔗 </span>
                  {url.length > 55 ? url.slice(0, 55) + '…' : url}
                </div>
              )}

              {/* Actions */}
              {generated ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  <DownloadDropdown
                    btnStyle={{ width:'100%', justifyContent:'center', padding:'12px', borderRadius:'12px', fontFamily:FONT, fontWeight:800, fontSize:'14px', background:`linear-gradient(135deg,${CI.cyan},${CI.purple})`, color:'#fff', border:'none', boxShadow:`0 4px 14px ${CI.cyan}35` }}
                    options={[
                      { label:'PNG (แนะนำ)', icon:'🖼️', ext:'PNG', color:'#2563eb', onClick:downloadPNG },
                      { label:'JPG',          icon:'📷', ext:'JPG', color:'#0369a1', onClick:downloadJPG },
                      { label:'SVG (Vector)', icon:'✏️', ext:'SVG', color:'#7c3aed', onClick:downloadSVG },
                      { label:'PDF',          icon:'📄', ext:'PDF', color:'#dc2626', onClick:downloadPDF },
                    ]}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    <button className="qr-download-action" onClick={() => { navigator.clipboard.writeText(url); toast.success('คัดลอก URL แล้ว'); }}
                      style={{ padding:'10px 8px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#475569', cursor:'pointer', fontSize:'12px', fontFamily:FONT, fontWeight:700, transition:'all 0.15s' }}>
                      📋 คัดลอก URL
                    </button>
                    <button className="qr-download-action" onClick={() => { setGenerated(false); setUrl(''); setLogo(null); setSize(300); setDarkColor('#1e293b'); setLightColor('#ffffff'); setActivePreset(0); }}
                      style={{ padding:'10px 8px', borderRadius:'10px', border:'1.5px solid #fee2e2', background:'#fff5f5', color:'#dc2626', cursor:'pointer', fontSize:'12px', fontFamily:FONT, fontWeight:700, transition:'all 0.15s' }}>
                      🔄 เริ่มใหม่
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize:'12px', color:'#cbd5e1', lineHeight:1.7, padding:'0 8px' }}>
                  <div>1. กรอก URL หรือข้อความ</div>
                  <div>2. เลือกสีและขนาด</div>
                  <div>3. กด <strong style={{ color:CI.cyan }}>สร้าง QR Code</strong></div>
                </div>
              )}
            </div>

            {/* Tips Card */}
            <div style={{ background:`linear-gradient(135deg,${CI.dark},#1a1a5e)`, borderRadius:'16px', padding:'16px 18px' }}>
              <div style={{ fontSize:'12px', fontWeight:800, color:CI.cyan, marginBottom:'8px', letterSpacing:'0.05em' }}>💡 เคล็ดลับ</div>
              {[
                'เลือก Error Level H เพื่อใส่โลโก้ได้ชัด',
                'ขนาด 300px+ เหมาะสำหรับพิมพ์',
                'SVG คมชัดทุกขนาด เหมาะทำสื่อ',
              ].map((t, i) => (
                <div key={i} style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'4px', paddingLeft:'12px', position:'relative' }}>
                  <span style={{ position:'absolute', left:0, color:CI.gold }}>·</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { background:'#fff', borderRadius:'16px', padding:'22px 20px', border:'1px solid #e8ecf0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' };
const cardHeader = { fontSize:'15px', fontWeight:800, color:'#1e293b', marginBottom:'16px', display:'flex', alignItems:'center', gap:'6px' };
