'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Loader2, Download, RefreshCw, LayoutGrid, Image as ImageIcon, Upload, X,
  Type, Wand2, FileImage, FileText, Presentation, ToggleLeft, ToggleRight,
  PanelLeftClose, PanelLeft, ALargeSmall,
  UserCircle2, Scissors, Check, ImagePlus, Calendar, Clock, Plus, Trash2, RotateCcw, Move,
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
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", category: 'sans', sample: 'Aa กข' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans', sample: 'Aa กข' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'raleway', name: 'Raleway', family: "'Raleway', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'oswald', name: 'Oswald', family: "'Oswald', sans-serif", category: 'sans', sample: 'Aa' },
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', sample: 'Aa' },
  { id: 'lora', name: 'Lora', family: "'Lora', serif", category: 'serif', sample: 'Aa' },
  { id: 'bebas', name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'display', sample: 'AA' },
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

const THAI_MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatDateThai(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d} ${THAI_MONTHS_FULL[m - 1]} ${y + 543}`;
}

function formatTimeThai(timeStr) {
  if (!timeStr) return '';
  return `${timeStr} น.`;
}

const INITIAL_FORM = {
  title: '',
  subtitle: '',
  description: '',
  speakers: [''],
  date: '',
  time: '',
  location: '',
  cta: '',
  hashtags: '',
  context: '',
  platform: 'fb-post',
  designType: 'event',
  visualStyle: 'pastel-sky',
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
  const [activeTab, setActiveTab] = useState('settings');
  const [selectedFont, setSelectedFont] = useState('kanit');
  const [fontCategory, setFontCategory] = useState('all');
  const [speakerPhoto, setSpeakerPhoto] = useState(null);
  const [speakerPhotoCutout, setSpeakerPhotoCutout] = useState(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [dragOverBg, setDragOverBg] = useState(false);
  const [dragOverSpeaker, setDragOverSpeaker] = useState(false);
  const [extraLogos, setExtraLogos] = useState([null, null, null]);
  const [logoScales, setLogoScales] = useState([1, 1, 1]);
  const [dragOverLogo, setDragOverLogo] = useState(-1);
  const [speakerScale, setSpeakerScale] = useState(1);
  const [exportQuality, setExportQuality] = useState(2);
  const [speakerPos, setSpeakerPos] = useState({ x: 0, y: 0 });
  const [layoutOverrides, setLayoutOverrides] = useState({});

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
  const baseTemplate = useMemo(
    () => TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0],
    [templateId]
  );
  const template = useMemo(() => {
    if (Object.keys(layoutOverrides).length === 0) return baseTemplate;
    const merged = { ...baseTemplate, blocks: { ...baseTemplate.blocks } };
    for (const [blockKey, overrides] of Object.entries(layoutOverrides)) {
      if (merged.blocks[blockKey]) {
        merged.blocks[blockKey] = { ...merged.blocks[blockKey], ...overrides };
      }
    }
    return merged;
  }, [baseTemplate, layoutOverrides]);
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
    setLayoutOverrides({});
  }, [formData.platform, templateId]);

  function updateField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function addSpeaker() {
    setFormData(prev => prev.speakers.length >= 3 ? prev : ({ ...prev, speakers: [...prev.speakers, ''] }));
  }

  function removeSpeaker(index) {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.length > 1
        ? prev.speakers.filter((_, i) => i !== index)
        : [''],
    }));
  }

  function updateBlockPos(blockKey, field, value) {
    setLayoutOverrides(prev => ({
      ...prev,
      [blockKey]: { ...(prev[blockKey] || {}), [field]: `${value}%` },
    }));
  }

  function updateBlockFont(blockKey, field, value) {
    setLayoutOverrides(prev => ({
      ...prev,
      [blockKey]: { ...(prev[blockKey] || {}), [field]: value },
    }));
  }

  function resetLayoutOverrides() {
    setLayoutOverrides({});
  }

  function updateSpeaker(index, value) {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.map((s, i) => i === index ? value : s),
    }));
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const prompt = buildPosterImagePrompt(formData, style);
      console.log('AI Prompt:', prompt);
      await new Promise(r => setTimeout(r, 1200));
      // Keep bgImage intact — don't clear the uploaded background
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  }

  function readImageFile(file, callback) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => callback(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    readImageFile(file, (dataUrl) => { setUploadedPhoto(dataUrl); setBgImage(dataUrl); });
  }

  function handleBgDrop(e) {
    e.preventDefault(); setDragOverBg(false);
    const file = e.dataTransfer.files?.[0];
    readImageFile(file, (dataUrl) => { setUploadedPhoto(dataUrl); setBgImage(dataUrl); });
  }

  function handleRemovePhoto() { setUploadedPhoto(null); setBgImage(null); }

  function handleSpeakerPhotoUpload(e) {
    const file = e.target.files?.[0];
    readImageFile(file, (dataUrl) => { setSpeakerPhoto(dataUrl); setSpeakerPhotoCutout(null); });
  }

  function handleSpeakerDrop(e) {
    e.preventDefault(); setDragOverSpeaker(false);
    const file = e.dataTransfer.files?.[0];
    readImageFile(file, (dataUrl) => { setSpeakerPhoto(dataUrl); setSpeakerPhotoCutout(null); });
  }

  function handleLogoUpload(index, e) {
    const file = e.target.files?.[0];
    readImageFile(file, (dataUrl) => {
      setExtraLogos(prev => { const n = [...prev]; n[index] = dataUrl; return n; });
    });
  }

  function handleLogoDrop(index, e) {
    e.preventDefault(); setDragOverLogo(-1);
    const file = e.dataTransfer.files?.[0];
    readImageFile(file, (dataUrl) => {
      setExtraLogos(prev => { const n = [...prev]; n[index] = dataUrl; return n; });
    });
  }

  function handleRemoveLogo(index) {
    setExtraLogos(prev => { const n = [...prev]; n[index] = null; return n; });
    setLogoScales(prev => { const n = [...prev]; n[index] = 1; return n; });
  }

  function handleLogoScale(index, delta) {
    setLogoScales(prev => {
      const n = [...prev];
      n[index] = Math.max(0.3, Math.min(3, n[index] + delta));
      return n;
    });
  }

  function handleRemoveSpeakerPhoto() {
    setSpeakerPhoto(null); setSpeakerPhotoCutout(null);
    setSpeakerScale(1); setSpeakerPos({x:0, y:0});
  }

  async function handleRemoveBg() {
    if (!speakerPhoto) return;
    setRemovingBg(true);
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const response = await fetch(speakerPhoto);
      const blob = await response.blob();
      const resultBlob = await removeBackground(blob, { output: { format: 'image/png' } });
      const url = URL.createObjectURL(resultBlob);
      setSpeakerPhotoCutout(url);
    } catch (err) {
      console.error('Background removal error:', err);
      alert('เกิดข้อผิดพลาดในการตัดพื้นหลัง กรุณาลองใหม่');
    } finally {
      setRemovingBg(false);
    }
  }

  function handleChangeLayout() {
    const idx = compatibleTemplates.findIndex(t => t.id === templateId);
    const next = (idx + 1) % compatibleTemplates.length;
    setTemplateId(compatibleTemplates[next].id);
  }

  function handleReset() {
    setFormData(INITIAL_FORM); setBgImage(null); setUploadedPhoto(null);
    setSpeakerPhoto(null); setSpeakerPhotoCutout(null);
    setSpeakerScale(1); setSpeakerPos({x:0, y:0});
    setExtraLogos([null, null, null]); setLogoScales([1, 1, 1]);
    setTemplateId('sq-center'); setOverlayStrength(40);
  }

  async function handleExport(format) {
    setExporting(format);
    try {
      const scale = exportQuality;
      switch (format) {
        case 'png':  await exportToPng(formData, 'poster-canvas', scale); break;
        case 'jpg':  await exportToJpg(formData, 'poster-canvas', scale); break;
        case 'pdf':  await exportToPdf(formData, preset, 'poster-canvas', scale); break;
        case 'pptx': await exportToPptx(formData, preset, 'poster-canvas', scale); break;
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e27' }}>
        <Loader2 size={32} className="spinner" style={{ color: '#00d4ff' }} />
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
            <div className="poster-sidebar-header">
              <h2 className="poster-sidebar-title">
                <Wand2 size={18} /> Poster Studio
              </h2>
              <button className="poster-sidebar-toggle" onClick={() => setSidebarOpen(false)} title="ซ่อนแถบเครื่องมือ" type="button">
                <PanelLeftClose size={18} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="poster-tab-bar">
              {[
                { id: 'settings', icon: <ImageIcon size={14} />, label: 'สไตล์' },
                { id: 'text', icon: <Type size={14} />, label: 'ข้อความ' },
                { id: 'font', icon: <ALargeSmall size={14} />, label: 'ฟอนต์' },
                { id: 'layout', icon: <LayoutGrid size={14} />, label: 'เลย์เอาต์' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`poster-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
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
                    <label className="poster-label"><Upload size={15} /> อัปโหลดรูปพื้นหลัง</label>
                    {uploadedPhoto ? (
                      <div className="poster-photo-preview">
                        <img src={uploadedPhoto} alt="Background" className="poster-photo-thumb" />
                        <button className="poster-photo-remove" onClick={handleRemovePhoto} type="button">
                          <X size={14} /> ลบรูป
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`poster-upload-area ${dragOverBg ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverBg(true); }}
                        onDragLeave={() => setDragOverBg(false)}
                        onDrop={handleBgDrop}
                      >
                        <Upload size={24} />
                        <span>{dragOverBg ? 'วางรูปที่นี่!' : 'คลิกหรือลากรูปมาวาง'}</span>
                        <span className="poster-upload-hint">JPG, PNG (แนะนำ 1200px+)</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                      </label>
                    )}
                    {uploadedPhoto && (
                      <div className="poster-overlay-control">
                        <label className="poster-overlay-label">ตัวกรองข้อความ: {overlayStrength}%</label>
                        <input
                          type="range" min="0" max="80" step="5"
                          value={overlayStrength}
                          onChange={e => setOverlayStrength(Number(e.target.value))}
                          className="poster-range"
                        />
                      </div>
                    )}
                  </div>

                  {/* Extra Logos */}
                  <div className="poster-section">
                    <label className="poster-label"><ImagePlus size={15} /> โลโก้เพิ่มเติม (สูงสุด 3)</label>
                    <div className="poster-logo-grid">
                      {extraLogos.map((logo, i) => (
                        <div key={i} className="poster-logo-slot">
                          {logo ? (
                            <div className="poster-logo-filled">
                              <img src={logo} alt={`Logo ${i + 1}`} className="poster-logo-img" style={{ transform: `scale(${logoScales[i]})` }} />
                              <button className="poster-logo-remove" onClick={() => handleRemoveLogo(i)} type="button" title="ลบโลโก้">
                                <X size={12} />
                              </button>
                              <div className="poster-logo-scale">
                                <button type="button" onClick={() => handleLogoScale(i, -0.1)} title="ลดขนาด">−</button>
                                <span>{Math.round(logoScales[i] * 100)}%</span>
                                <button type="button" onClick={() => handleLogoScale(i, 0.1)} title="เพิ่มขนาด">+</button>
                              </div>
                            </div>
                          ) : (
                            <label
                              className={`poster-logo-drop ${dragOverLogo === i ? 'drag-over' : ''}`}
                              onDragOver={(e) => { e.preventDefault(); setDragOverLogo(i); }}
                              onDragLeave={() => setDragOverLogo(-1)}
                              onDrop={(e) => handleLogoDrop(i, e)}
                            >
                              <ImagePlus size={18} />
                              <span>{dragOverLogo === i ? 'วาง!' : `โลโก้ ${i + 1}`}</span>
                              <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(i, e)} hidden />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ===== TAB: Text ===== */}
              {activeTab === 'text' && (
                <>
                  <div className="poster-section">
                    <label className="poster-label"><Type size={15} /> ข้อความบนโปสเตอร์</label>
                    <div className="poster-fields">
                      <input className="poster-input" placeholder="หัวข้อหลัก *" value={formData.title}
                        onChange={e => updateField('title', e.target.value)} />
                      <input className="poster-input" placeholder="ข้อความรอง / Subtitle" value={formData.subtitle}
                        onChange={e => updateField('subtitle', e.target.value)} />
                      {/* Multi-speaker inputs */}
                      <div className="poster-speakers-group">
                        <label className="poster-label-sm"><UserCircle2 size={13} /> วิทยากร</label>
                        {formData.speakers.map((spk, i) => (
                          <div key={i} className="poster-speaker-row">
                            <input
                              className="poster-input"
                              placeholder={`ชื่อวิทยากร ${formData.speakers.length > 1 ? i + 1 : ''}`}
                              value={spk}
                              onChange={e => updateSpeaker(i, e.target.value)}
                            />
                            {formData.speakers.length > 1 && (
                              <button type="button" className="poster-speaker-remove" onClick={() => removeSpeaker(i)} title="ลบวิทยากร">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.speakers.length < 3 && (
                          <button type="button" className="poster-speaker-add" onClick={addSpeaker}>
                            <Plus size={14} /> เพิ่มวิทยากร ({formData.speakers.length}/3)
                          </button>
                        )}
                      </div>

                      {/* Date & Time — native HTML5 inputs */}
                      <div className="poster-input-row">
                        <div className="poster-date-native">
                          <label className="poster-label-sm"><Calendar size={13} /> วันที่</label>
                          <input
                            type="date"
                            className="poster-input poster-input-date"
                            value={formData.date}
                            onChange={e => updateField('date', e.target.value)}
                          />
                          {formData.date && (
                            <span className="poster-date-display">{formatDateThai(formData.date)}</span>
                          )}
                        </div>
                        <div className="poster-time-native">
                          <label className="poster-label-sm"><Clock size={13} /> เวลา</label>
                          <input
                            type="time"
                            className="poster-input poster-input-time"
                            value={formData.time}
                            onChange={e => updateField('time', e.target.value)}
                          />
                          {formData.time && (
                            <span className="poster-date-display">{formatTimeThai(formData.time)}</span>
                          )}
                        </div>
                      </div>

                      <input className="poster-input" placeholder="สถานที่" value={formData.location}
                        onChange={e => updateField('location', e.target.value)} />
                      <input className="poster-input" placeholder="ปุ่ม CTA เช่น ลงทะเบียนเลย!" value={formData.cta}
                        onChange={e => updateField('cta', e.target.value)} />
                      <input className="poster-input" placeholder="#Hashtags" value={formData.hashtags}
                        onChange={e => updateField('hashtags', e.target.value)} />
                    </div>
                  </div>

                  {/* Speaker Photo Upload + BG Removal */}
                  <div className="poster-section">
                    <label className="poster-label"><UserCircle2 size={15} /> รูปวิทยากร / บุคคล</label>
                    {speakerPhoto ? (
                      <div className="speaker-photo-area">
                        <div className="speaker-photo-preview-row">
                          <div className="speaker-photo-card">
                            <img src={speakerPhoto} alt="Speaker" className="speaker-photo-img" />
                            <span className="speaker-photo-badge">ต้นฉบับ</span>
                          </div>
                          {speakerPhotoCutout && (
                            <div className="speaker-photo-card cutout">
                              <img src={speakerPhotoCutout} alt="Cutout" className="speaker-photo-img" />
                              <span className="speaker-photo-badge success"><Check size={10} /> ตัดแล้ว</span>
                            </div>
                          )}
                        </div>
                        <div className="speaker-photo-actions">
                          <button className="poster-btn poster-btn-accent" onClick={handleRemoveBg} disabled={removingBg || !!speakerPhotoCutout} type="button">
                            {removingBg ? <><Loader2 size={14} className="spinner" /> กำลังตัดพื้นหลัง...</>
                              : speakerPhotoCutout ? <><Check size={14} /> ตัดพื้นหลังแล้ว</>
                              : <><Scissors size={14} /> ตัดพื้นหลัง</>}
                          </button>
                          <button className="poster-btn poster-btn-ghost" onClick={handleRemoveSpeakerPhoto} type="button">
                            <X size={14} /> ลบรูป
                          </button>
                        </div>
                        <div className="speaker-controls-group">
                          <div className="speaker-scale-control">
                            <label className="poster-label-sm">ขนาด</label>
                            <div className="poster-logo-scale visible">
                              <button type="button" onClick={() => setSpeakerScale(s => Math.max(0.3, s - 0.1))}>−</button>
                              <span>{Math.round(speakerScale * 100)}%</span>
                              <button type="button" onClick={() => setSpeakerScale(s => Math.min(2, s + 0.1))}>+</button>
                            </div>
                          </div>
                          <div className="speaker-scale-control">
                            <label className="poster-label-sm">ตำแหน่ง</label>
                            <div className="speaker-pos-pad">
                              <button type="button" onClick={() => setSpeakerPos(p => ({...p, x: p.x - 3}))}>←</button>
                              <button type="button" onClick={() => setSpeakerPos(p => ({...p, y: p.y - 3}))}>↑</button>
                              <button type="button" onClick={() => setSpeakerPos(p => ({...p, y: p.y + 3}))}>↓</button>
                              <button type="button" onClick={() => setSpeakerPos(p => ({...p, x: p.x + 3}))}>→</button>
                              <button type="button" onClick={() => setSpeakerPos({x:0,y:0})} className="reset-btn">⟳</button>
                            </div>
                          </div>
                        </div>
                        {removingBg && (
                          <div className="speaker-bg-progress">
                            <div className="speaker-bg-progress-bar" />
                            <span>AI กำลังตัดพื้นหลัง อาจใช้เวลา 10-30 วินาที...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label
                        className={`poster-upload-area speaker-upload ${dragOverSpeaker ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverSpeaker(true); }}
                        onDragLeave={() => setDragOverSpeaker(false)}
                        onDrop={handleSpeakerDrop}
                      >
                        <UserCircle2 size={28} />
                        <span>{dragOverSpeaker ? 'วางรูปที่นี่!' : 'คลิกหรือลากรูปมาวาง'}</span>
                        <span className="poster-upload-hint">จะตัดพื้นหลังออกให้อัตโนมัติ</span>
                        <input type="file" accept="image/*" onChange={handleSpeakerPhotoUpload} hidden />
                      </label>
                    )}
                  </div>
                </>
              )}

              {/* ===== TAB: Font ===== */}
              {activeTab === 'font' && (
                <div className="poster-section">
                  <label className="poster-label"><ALargeSmall size={15} /> เลือกฟอนต์</label>
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
                  <div className="poster-font-list">
                    {filteredFonts.map(font => (
                      <button
                        key={font.id}
                        className={`poster-font-item ${selectedFont === font.id ? 'active' : ''}`}
                        onClick={() => setSelectedFont(font.id)}
                        type="button"
                      >
                        <span className="poster-font-sample" style={{ fontFamily: font.family }}>{font.sample}</span>
                        <div className="poster-font-info">
                          <span className="poster-font-name">{font.name}</span>
                          <span className="poster-font-cat-label">{font.category === 'thai' ? 'ไทย' : font.category}</span>
                        </div>
                        <span className="poster-font-preview-text" style={{ fontFamily: font.family }}>
                          SPUBUS BIZ CONTENT สวัสดี
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="poster-font-current">
                    <span>ฟอนต์ที่เลือก:</span>
                    <strong style={{ fontFamily: fontObj.family }}>{fontObj.name}</strong>
                  </div>
                </div>
              )}

              {/* ===== TAB: Layout ===== */}
              {activeTab === 'layout' && (
                <>
                <div className="poster-section">
                  <label className="poster-label"><LayoutGrid size={15} /> เลือกเลย์เอาต์ ({compatibleTemplates.length} แบบ)</label>
                  <div className="poster-layout-picker">
                    {compatibleTemplates.map(t => (
                      <button
                        key={t.id}
                        className={`poster-layout-card ${templateId === t.id ? 'active' : ''}`}
                        onClick={() => setTemplateId(t.id)}
                        type="button"
                      >
                        <div className="poster-layout-thumb">
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
                                  opacity: key === 'title' ? 1 : key === 'cta' ? 0.8 : 0.5,
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

                {/* Layout position editor */}
                <div className="poster-section">
                  <label className="poster-label"><Move size={15} /> ปรับตำแหน่งข้อความ</label>
                  {Object.keys(template.blocks).length > 0 && (
                    <div className="layout-editor-blocks">
                      {Object.entries(template.blocks).map(([blockKey, block]) => {
                        const blockLabels = { title: 'หัวข้อ', subtitle: 'หัวข้อรอง', speaker: 'วิทยากร', info: 'ข้อมูล', cta: 'ปุ่ม CTA' };
                        const currentX = parseFloat(layoutOverrides[blockKey]?.x || block.x);
                        const currentY = parseFloat(layoutOverrides[blockKey]?.y || block.y);
                        const currentW = parseFloat(layoutOverrides[blockKey]?.w || block.w);
                        const currentMinFont = layoutOverrides[blockKey]?.minFont ?? block.minFont;
                        const currentMaxFont = layoutOverrides[blockKey]?.maxFont ?? block.maxFont;
                        return (
                          <div key={blockKey} className="layout-editor-block">
                            <div className="layout-editor-block-header">
                              <span className="layout-editor-block-name">{blockLabels[blockKey] || blockKey}</span>
                            </div>
                            <div className="layout-editor-controls">
                              <div className="layout-editor-field">
                                <span className="layout-editor-field-label">X</span>
                                <input type="range" className="poster-range" min="0" max="80" step="1"
                                  value={currentX} onChange={e => updateBlockPos(blockKey, 'x', e.target.value)} />
                                <span className="layout-editor-field-value">{Math.round(currentX)}%</span>
                              </div>
                              <div className="layout-editor-field">
                                <span className="layout-editor-field-label">Y</span>
                                <input type="range" className="poster-range" min="0" max="95" step="1"
                                  value={currentY} onChange={e => updateBlockPos(blockKey, 'y', e.target.value)} />
                                <span className="layout-editor-field-value">{Math.round(currentY)}%</span>
                              </div>
                              <div className="layout-editor-field">
                                <span className="layout-editor-field-label">W</span>
                                <input type="range" className="poster-range" min="10" max="100" step="1"
                                  value={currentW} onChange={e => updateBlockPos(blockKey, 'w', e.target.value)} />
                                <span className="layout-editor-field-value">{Math.round(currentW)}%</span>
                              </div>
                              <div className="layout-editor-field">
                                <span className="layout-editor-field-label">ฟอนต์</span>
                                <input type="range" className="poster-range" min="8" max="60" step="1"
                                  value={currentMaxFont} onChange={e => updateBlockFont(blockKey, 'maxFont', Number(e.target.value))} />
                                <span className="layout-editor-field-value">{currentMaxFont}px</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(layoutOverrides).length > 0 && (
                        <button type="button" className="poster-btn poster-btn-ghost" onClick={resetLayoutOverrides} style={{ marginTop: 8 }}>
                          <RotateCcw size={14} /> รีเซ็ตเลย์เอาต์
                        </button>
                      )}
                    </div>
                  )}
                </div>
                </>
              )}
            </div>

            {/* Sidebar footer */}
            <div className="poster-sidebar-footer">
              <button className="poster-btn poster-btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating
                  ? <><Loader2 size={16} className="spinner" /> กำลังสร้าง...</>
                  : <><Wand2 size={16} /> สร้างโปสเตอร์</>}
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

          {/* Sidebar open button */}
          {!sidebarOpen && (
            <button className="poster-sidebar-open-btn" onClick={() => setSidebarOpen(true)} title="แสดงแถบเครื่องมือ" type="button">
              <PanelLeft size={20} />
            </button>
          )}

          {/* ========== MAIN PREVIEW AREA ========== */}
          <div className="poster-main-area">
            <div className="poster-toolbar">
              <div className="poster-toolbar-left">
                <span className="poster-toolbar-info">{preset.icon} {preset.name} · {preset.w}×{preset.h}</span>
                <span className="poster-toolbar-divider">|</span>
                <span className="poster-toolbar-info">🎨 {template.name}</span>
              </div>
              <div className="poster-toolbar-right">
                <button className="poster-toolbar-btn" onClick={() => setShowDebug(!showDebug)} title="Debug safe areas" type="button">
                  {showDebug ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  <span>Debug</span>
                </button>
              </div>
            </div>

            <div className="poster-canvas-stage">
              <div className="poster-canvas-frame">
                <PosterCanvas
                  formData={formData} template={template} style={style} preset={preset}
                  bgImage={bgImage} showDebug={showDebug} overlayStrength={overlayStrength}
                  fontFamily={fontObj.family} speakerPhoto={speakerPhotoCutout || speakerPhoto}
                  speakerScale={speakerScale} speakerPos={speakerPos}
                  extraLogos={extraLogos} logoScales={logoScales}
                />
              </div>
            </div>

            {/* Export bar */}
            <div className="poster-export-bar">
              <div className="poster-export-row">
                <span className="poster-export-label"><Download size={15} /> ดาวน์โหลด:</span>
                <div className="poster-export-quality">
                  {[
                    { value: 1, label: 'ปกติ', desc: '1x' },
                    { value: 2, label: 'สูง', desc: '2x' },
                    { value: 3, label: 'สูงมาก', desc: '3x' },
                    { value: 4, label: 'พิมพ์', desc: '4x' },
                  ].map(q => (
                    <button
                      key={q.value} type="button"
                      className={`poster-quality-btn ${exportQuality === q.value ? 'active' : ''}`}
                      onClick={() => setExportQuality(q.value)}
                    >
                      <span className="q-label">{q.label}</span>
                      <span className="q-desc">{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="poster-export-resolution">
                {preset && <span>ขนาดไฟล์: {(preset.w || 1200) * exportQuality} × {(preset.h || 1200) * exportQuality} px</span>}
              </div>
              <div className="poster-export-btns">
                <button className="poster-export-btn" onClick={() => handleExport('png')} disabled={!!exporting}>
                  {exporting === 'png' ? <Loader2 size={14} className="spinner" /> : <FileImage size={14} />} PNG
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('jpg')} disabled={!!exporting}>
                  {exporting === 'jpg' ? <Loader2 size={14} className="spinner" /> : <FileImage size={14} />} JPG
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('pdf')} disabled={!!exporting}>
                  {exporting === 'pdf' ? <Loader2 size={14} className="spinner" /> : <FileText size={14} />} PDF
                </button>
                <button className="poster-export-btn" onClick={() => handleExport('pptx')} disabled={!!exporting}>
                  {exporting === 'pptx' ? <Loader2 size={14} className="spinner" /> : <Presentation size={14} />} PPTX
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
