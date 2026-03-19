'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function generateShortCode() {
  return Math.random().toString(36).substring(2, 7);
}

export default function URLShortener() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [links, setLinks] = useState([]);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('teacher_short_links');
    if (saved) setLinks(JSON.parse(saved));
  }, []);

  const saveLinks = (l) => {
    setLinks(l);
    localStorage.setItem('teacher_short_links', JSON.stringify(l));
  };

  const shorten = () => {
    if (!url.trim()) { toast.error('กรุณากรอก URL'); return; }
    if (!url.startsWith('http')) { toast.error('URL ต้องขึ้นต้นด้วย http:// หรือ https://'); return; }

    const code = customCode.trim() || generateShortCode();
    const existing = links.find(l => l.code === code);
    if (existing) { toast.error(`Code "${code}" มีอยู่แล้ว`); return; }

    const newLink = {
      id: Date.now().toString(),
      originalUrl: url,
      code,
      shortUrl: `${window.location.origin}/s/${code}`,
      createdAt: Date.now(),
      clicks: 0,
      label: '',
    };
    const updated = [newLink, ...links];
    saveLinks(updated);
    setUrl('');
    setCustomCode('');
    toast.success('ย่อลิงก์แล้ว!');
  };

  const copyLink = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    toast.success('คัดลอกแล้ว!');
  };

  const incrementClick = (id) => {
    const updated = links.map(l => l.id === id ? { ...l, clicks: (l.clicks || 0) + 1 } : l);
    saveLinks(updated);
  };

  const deleteLink = (id) => {
    const updated = links.filter(l => l.id !== id);
    saveLinks(updated);
    toast('ลบแล้ว');
  };

  const updateLabel = (id, label) => {
    const updated = links.map(l => l.id === id ? { ...l, label } : l);
    saveLinks(updated);
  };

  const totalClicks = links.reduce((a, l) => a + (l.clicks || 0), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'ลิงก์ทั้งหมด', value: links.length, icon: '🔗', color: '#2563eb' },
          { label: 'Clicks รวม', value: totalClicks, icon: '👆', color: '#0d9488' },
          { label: 'Active วันนี้', value: links.filter(l => Date.now() - l.createdAt < 86400000).length, icon: '✅', color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Shorten form */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>🔗 ย่อลิงก์ใหม่</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            placeholder="https://example.com/very-long-url..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && shorten()}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={shorten}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700,
              fontSize: '14px', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            ✂️ ย่อลิงก์
          </button>
        </div>

        <button
          onClick={() => setShowCustom(!showCustom)}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', padding: 0 }}
        >
          {showCustom ? '▲ ซ่อน' : '▼ กำหนด Code เอง'}
        </button>

        {showCustom && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/s/
            </span>
            <input
              placeholder="my-custom-code"
              value={customCode}
              onChange={e => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        )}
      </div>

      {/* Links list */}
      {links.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>📋 ลิงก์ทั้งหมด</h3>
            <button
              onClick={() => { saveLinks([]); toast('ลบทั้งหมดแล้ว'); }}
              style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ลบทั้งหมด
            </button>
          </div>
          <div>
            {links.map((link, i) => (
              <div key={link.id} style={{
                padding: '14px 20px', borderBottom: i < links.length - 1 ? '1px solid #f1f5f9' : 'none',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                {/* Short URL */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                      /s/{link.code}
                    </span>
                    <button
                      onClick={() => copyLink(link.shortUrl)}
                      style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}
                    >
                      📋 คัดลอก
                    </button>
                    <button
                      onClick={() => { window.open(link.originalUrl, '_blank'); incrementClick(link.id); }}
                      style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}
                    >
                      🔗 เปิด
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                    {link.originalUrl}
                  </div>
                  <input
                    placeholder="ป้ายกำกับ (ไม่บังคับ)"
                    value={link.label}
                    onChange={e => updateLabel(link.id, e.target.value)}
                    style={{ fontSize: '11px', color: '#94a3b8', border: 'none', background: 'none', outline: 'none', marginTop: '2px', width: '200px', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d9488' }}>{link.clicks}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>clicks</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>
                    {new Date(link.createdAt).toLocaleDateString('th-TH')}
                  </div>
                </div>

                <button
                  onClick={() => deleteLink(link.id)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {links.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
          <div>ยังไม่มีลิงก์ที่ย่อ</div>
        </div>
      )}

      <div style={{ background: '#eff6ff', borderRadius: '10px', padding: '12px 16px', border: '1px solid #bfdbfe', marginTop: '16px', fontSize: '12px', color: '#1d4ed8' }}>
        💡 ลิงก์ที่ย่อเก็บไว้ใน localStorage ของ browser นี้ | การ Track Clicks จะนับเมื่อกดปุ่ม "เปิด" ในหน้านี้
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
  fontSize: '13px', outline: 'none', color: '#1e293b', fontFamily: 'inherit',
};
