'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Loader2, Download, RefreshCw, LayoutGrid, Image as ImageIcon, Upload, X,
  Type, Wand2, FileImage, FileText, Presentation, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, Maximize2, Minimize2, ALargeSmall,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import PosterCanvas from '@/components/poster/PosterCanvas';
import {
  PLATFORM_PRESETS, DESIGN_TYPES, VISUAL_STYLES,
  TEMPLATES, getCompatibleTemplates,
} from '@/lib/poster/presets';
import { exportToPng, exportToJpg, exportToPdf, exportToPptx } from '@/lib/poster/exportUtils';
import { buildPosterImagePrompt } from '@/lib/poster/promptBuilder';

// Font library — international + Thai
const FONT_LIST = [
  // === Sans-serif (สากล) ===
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", category: 'sans', sample: 'Aa กข' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans', sample: 'Aa กข' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'raleway', name: 'Raleway', family: "'Raleway', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'oswald', name: 'Oswald', family: "'Oswald', sans-serif", category: 'sans', sample: 'Aa' },
  // === Display / Serif ===
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', sample: 'Aa' },
  { id: 'lora', name: 'Lora', family: "'Lora', serif", category: 'serif', sample: 'Aa' },
  { id: 'bebas', name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'display', sample: 'AA' },
  // === ฟอนต์ไทย ===
  { id: 'noto-thai', name: 'Noto Sans Thai', family: "'Noto Sans Thai', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'kanit', name: 'Kanit', family: "'Kanit', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'prompt', name: 'Prompt', family: "'Prompt', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'sarabun', name: 'Sarabun', family: "'Sarabun', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'ibm-plex-thai', name: 'IBM Plex Sans Thai', family: "'IBM Plex Sans Thai', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'mitr', name: 'Mitr', family: "'Mitr', sans-serif", category: 'thai', sample: 'กขค' },
  { id: 'chakra-petch', name: 'Chakra Petch', family: "'Chakra Petch', sans-serif", category: 'thai', sample: 'กขค' },
];

const FONT_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'sans', label: 'Sans-serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'thai', label: 'ฟอนต์ไทย' },
];

const INITIAL_FORM = {
  title: '',
  subtitle: '',
  description: '',
  speaker: '',
  date: '',
  time: '',
  location: '',
  cta: '',
  hashtags: '',
  context: '',
  platform: 'fb-post',
  designType: 'event',
  visualStyle: 'modern-biz',
  showBranding: true,
};

export default function PosterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [templateId, setTemplateId] = useState('sq-center');
  const [bgImage, setBgImage] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [overlayStrength, setOverlayStrength] = useState(40);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('settings'); // settings | text | layout
  const [selectedFont, setSelectedFont] = useState('kanit');
  const [fontCategory, setFontCategory] = useState('all');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const preset = useMemo(
    () => PLATFORM_PRESETS.find(p => p.id === formData.platform) || PLATFORM_PRESETS[0],
    [formData.platform]
  );
  const style = useMemo(
    () => VISUAL_STYLES.find(v => v.id === formData.visualStyle) || VISUAL_STYLES[0],
    [formData.visualStyle]
  );
  const template = useMemo(
    () => TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0],
    [templateId]
  );
  const compatibleTemplates = useMemo(
    () => getCompatibleTemplates(formData.platform),
    [formData.platform]
  );
  const fontObj = useMemo(
    () => FONT_LIST.find(f => f.id === selectedFont) || FONT_LIST[0],
    [selectedFont]
  );
  const filteredFonts = useMemo(
    () => fontCategory === 'all' ? FONT_LIST : FONT_LIST.filter(f => f.category === fontCategory),
    [fontCategory]
  );

  useEffect(() => {
    const compat = getCompatibleTemplates(formData.platform);
    if (compat.length > 0 && !compat.find(t => t.id === templateId)) {
      setTemplateId(compat[0].id);
    }
  }, [formData.platform]);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const prompt = buildPosterImagePrompt(formData, style);
      console.log('AI Prompt:', prompt);
      await new Promise(r => setTimeout(r, 1200));
      setBgImage(null);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedPhoto(ev.target.result);
      setBgImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setUploadedPhoto(null);
    setBgImage(null);
  }

  function handleChangeLayout() {
    const idx = compatibleTemplates.findIndex(t => t.id === templateId);
    const next = (idx + 1) % compatibleTemplates.length;
    setTemplateId(compatibleTemplates[next].id);
  }

  function handleReset() {
    setFormData(INITIAL_FORM);
    setBgImage(null);
    setUploadedPhoto(null);
    setTemplateId('sq-center');
    setOverlayStrength(40);
  }

  async function handleExport(format) {
    setExporting(format);
    try {
      switch (format) {
        case 'png':  await exportToPng(formData); break;
        case 'jpg':  await exportToJpg(formData); break;
        case 'pdf':  await exportToPdf(formData, preset); break;
        case 'pptx': await exportToPptx(formData, preset); break;
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('เกิดข้อผิดพลาดในการ export กรุณาลองใหม่');
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spinner" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="poster-page-v2">
        <div className={`poster-v2-layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>

          {/* ========== LEFT SIDEBAR ========== */}
          <aside className={`poster-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            {/* Sidebar header */}
            <div className="poster-sidebar-header">
              <h2 className="poster-sidebar-title">
                <Wand2 size={18} /> ตั้งค่าโปสเตอร์
              </h2>
              <button
                className="poster-sidebar-toggle"
                onClick={() => setSidebarOpen(false)}
                title="ซ่อนแถบเครื่องมือ"
                type="button"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="poster-tab-bar">
              <button
                className={`poster-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                type="button"
              >
                <ImageIcon size={14} /> สไตล์
              </button>
              <button
                className={`poster-tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
                type="button"
              >
                <Type size={14} /> ข้อความ
              </button>
              <button
                className={`poster-tab ${activeTab === 'font' ? 'active' : ''}`}
                onClick={() => setActiveTab('font')}
                type="button"
              >
                <ALargeSmall size={14} /> ฟอนต์
              </button>
              <button
                className={`poster-tab ${activeTab === 'layout' ? 'active' : ''}`}
                onClick={() => setActiveTab('layout')}
                type="button"
              >
                <LayoutGrid size={14} /> เลย์เอาต์
              </button>
            </div>

            {/* Tab content */}
            <div className="poster-sidebar-content">
              {/* ===== TAB: Settings ===== */}
              {activeTab === 'settings' && (
                <>
                  {/* Platform */}
                  <div className="poster-section">
                    <label className="poster-label">แพลตฟอร์ม / ขนาด</label>
                    <div className="poster-preset-grid">
                      {PLATFORM_PRESETS.map(p => (
                        <button
                          key={p.id}
                          className={`poster-preset-btn ${formData.platform === p.id ? 'active' : ''}`}
                          onClick={() => updateField('platform', p.id)}
                          type="button"
                        >
                          <span className="preset-icon">{p.icon}</span>
                          <span className="preset-name">{p.name}</span>
                          <span className="preset-size">{p.w}x{p.h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Design Type */}
                  <div className="poster-section">
                    <label className="poster-label">ประเภทงาน</label>
                    <div className="poster-chip-grid">
                      {DESIGN_TYPES.map(d => (
                        <button
                          key={d.id}
                          className={`poster-chip ${formData.designType === d.id ? 'active' : ''}`}
                          onClick={() => updateField('designType', d.id)}
                          type="button"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Style */}
                  <div className="poster-section">
                    <label className="poster-label">สไตล์ภาพ</label>
                    <div className="poster-style-grid">
                      {VISUAL_STYLES.map(v => (
                        <button
                          key={v.id}
                          className={`poster-style-btn ${formData.visualStyle === v.id ? 'active' : ''}`}
                          onClick={() => updateField('visualStyle', v.id)}
                          type="button"
                          style={{
                            background: v.gradient,
                            borderColor: formData.visualStyle === v.id ? v.accent : 'transparent',
                          }}
                        >
                          <span className="style-label">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="poster-section">
                    <label className="poster-label">
                      <Upload size={15} /> อัปโหลดรูปพื้นหลัง
                    </label>
                    {uploadedPhoto ? (
                      <div className="poster-photo-preview">
                        <img src={uploadedPhoto} alt="Background" className="poster-photo-thumb" />
                        <button className="poster-photo-remove" onClick={handleRemovePhoto} type="button">
                          <X size={14} /> ลบรูป
                        </button>
                      </div>
                    ) : (
                      <label className="poster-upload-area">
                        <Upload size={24} />
                        <span>คลิกเพื่ออัปโหลด</span>
                        <span className="poster-upload-hint">JPG, PNG (แนะนำ 1200px+)</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                      </label>
                    )}
                    {uploadedPhoto && (
                      <div className="poster-overlay-control">
                        <label className="poster-overlay-label">ตัวกรองข้อความ: {overlayStrength}%</label>
                        <input
                          type="range"
                          min="0" max="80" step="5"
                          value={overlayStrength}
                          onChange={e => setOverlayStrength(Number(e.target.value))}
                          className="poster-range"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ===== TAB: Text ===== */}
              {activeTab === 'text' && (
                <div className="poster-section">
                  <label className="poster-label">
                    <Type size={15} /> ข้อความบนโปสเตอร์
                  </label>
                  <div className="poster-fields">
                    <input className="poster-input" placeholder="หัวข้อหลัก *" value={formData.title}
                      onChange={e => updateField('title', e.target.value)} />
                    <input className="poster-input" placeholder="ข้อความรอง / Subtitle" value={formData.subtitle}
                      onChange={e => updateField('subtitle', e.target.value)} />
                    <input className="poster-input" placeholder="ชื่อวิทยากร" value={formData.speaker}
                      onChange={e => updateField('speaker', e.target.value)} />
                    <div className="poster-input-row">
                      <input className="poster-input" placeholder="📅 วันที่" value={formData.date}
                        onChange={e => updateField('date', e.target.value)} />
                      <input className="poster-input" placeholder="⏰ เวลา" value={formData.time}
                        onChange={e => updateField('time', e.target.value)} />
                    </div>
                    <input className="poster-input" placeholder="📍 สถานที่" value={formData.location}
                      onChange={e => updateField('location', e.target.value)} />
                    <input className="poster-input" placeholder="ปุ่ม CTA เช่น ลงทะเบียนเลย!" value={formData.cta}
                      onChange={e => updateField('cta', e.target.value)} />
                    <input className="poster-input" placeholder="#Hashtags" value={formData.hashtags}
                      onChange={e => updateField('hashtags', e.target.value)} />
                  </div>
                </div>
              )}

              {/* ===== TAB: Font ===== */}
              {activeTab === 'font' && (
                <div className="poster-section">
                  <label className="poster-label">
                    <ALargeSmall size={15} /> เลือกฟอนต์
                  </label>

                  {/* Font category filter */}
                  <div className="poster-font-categories">
                    {FONT_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        className={`poster-font-cat-btn ${fontCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setFontCategory(cat.id)}
                        type="button"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Font preview + selector */}
                  <div className="poster-font-list">
                    {filteredFonts.map(font => (
                      <button
                        key={font.id}
                        className={`poster-font-item ${selectedFont === font.id ? 'active' : ''}`}
                        onClick={() => setSelectedFont(font.id)}
                        type="button"
                      >
                        <span
                          className="poster-font-sample"
                          style={{ fontFamily: font.family }}
                        >
                          {font.sample}
                        </span>
                        <div className="poster-font-info">
                          <span className="poster-font-name">{font.name}</span>
                          <span className="poster-font-cat-label">{font.category === 'thai' ? 'ไทย' : font.category}</span>
                        </div>
                        <span
                          className="poster-font-preview-text"
                          style={{ fontFamily: font.family }}
                        >
                          BiZ Content สวัสดี
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Current font display */}
                  <div className="poster-font-current">
                    <span>ฟอนต์ที่เลือก:</span>
                    <strong style={{ fontFamily: fontObj.family }}>{fontObj.name}</strong>
                  </div>
                </div>
              )}

              {/* ===== TAB: Layout ===== */}
              {activeTab === 'layout' && (
                <div className="poster-section">
                  <label className="poster-label">
                    <LayoutGrid size={15} /> เลือกเลย์เอาต์
                  </label>
                  <div className="poster-layout-picker">
                    {compatibleTemplates.map(t => (
                      <button
                        key={t.id}
                        className={`poster-layout-card ${templateId === t.id ? 'active' : ''}`}
                        onClick={() => setTemplateId(t.id)}
                        type="button"
                      >
                        <div className="poster-layout-thumb">
                          {/* Mini layout preview */}
                          <div className="layout-mini-preview" data-layout={t.id}>
                            {Object.entries(t.blocks).map(([key, block]) => (
                              <div
                                key={key}
                                className="layout-mini-block"
                                style={{
                                  left: block.x,
                                  top: block.y,
                                  width: block.w,
                                  height: key === 'title' ? '14%' : key === 'cta' ? '8%' : '6%',
                                  opacity: key === 'title' ? 1 : 0.5,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="poster-layout-name">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar footer actions */}
            <div className="poster-sidebar-footer">
              <button className="poster-btn poster-btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating
                  ? <><Loader2 size={16} className="spinner" /> กำลังสร้าง...</>
                  : <><Wand2 size={16} /> สร้างโปสเตอร์</>
                }
              </button>
              <div className="poster-action-row">
                <button className="poster-btn poster-btn-ghost" onClick={handleChangeLayout} type="button">
                  <LayoutGrid size={14} /> เปลี่ยนเลย์เอาต์
                </button>
                <button className="poster-btn poster-btn-danger" onClick={handleReset} type="button">
                  <RefreshCw size={14} /> ล้าง
                </button>
              </div>
            </div>
          </aside>

          {/* Sidebar open button (when collapsed) */}
          {!sidebarOpen && (
            <button
              className="poster-sidebar-open-btn"
              onClick={() => setSidebarOpen(true)}
              title="แสดงแถบเครื่องมือ"
              type="button"
            >
              <PanelLeft size={20} />
            </button>
          )}

          {/* ========== MAIN PREVIEW AREA ========== */}
          <div className="poster-main-area">
            {/* Top toolbar */}
            <div className="poster-toolbar">
              <div className="poster-toolbar-left">
                <span className="poster-toolbar-info">
                  {preset.icon} {preset.name} · {preset.w}×{preset.h}
                </span>
                <span className="poster-toolbar-divider">|</span>
                <span className="poster-toolbar-info">
                  🎨 {template.name}
                </span>
              </div>
              <div className="poster-toolbar-right">
                <button
                  className="poster-toolbar-btn"
                  onClick={() => setShowDebug(!showDebug)}
                  title="Debug safe areas"
                  type="button"
                >
                  {showDebug ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>Debug</span>
                </button>
              </div>
            </div>

            {/* Canvas — big & centered */}
            <div className="poster-canvas-stage">
              <div className="poster-canvas-frame">
                <PosterCanvas
                  formData={formData}
                  template={template}
                  style={style}
                  preset={preset}
                  bgImage={bgImage}
                  showDebug={showDebug}
                  overlayStrength={overlayStrength}
                  fontFamily={fontObj.family}
                />
              </div>
            </div>

            {/* Export bar — bottom */}
            <div className="poster-export-bar">
              <span className="poster-export-label"><Download size={15} /> ดาวน์โหลด:</span>
              <div className="poster-export-btns">
                <button className="poster-export-btn" onClick={() => handleExport('png')} disabled={!!exporting}>
                  {exporting === 'png' ? <Loader2 size={14} className="spinner" /> : <FileImage size={14} />}
                  PNG
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('jpg')} disabled={!!exporting}>
                  {exporting === 'jpg' ? <Loader2 size={14} className="spinner" /> : <FileImage size={14} />}
                  JPG
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('pdf')} disabled={!!exporting}>
                  {exporting === 'pdf' ? <Loader2 size={14} className="spinner" /> : <FileText size={14} />}
                  PDF
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('pptx')} disabled={!!exporting}>
                  {exporting === 'pptx' ? <Loader2 size={14} className="spinner" /> : <Presentation size={14} />}
                  PPTX
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
