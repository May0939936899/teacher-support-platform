'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Loader2, Download, RefreshCw, LayoutGrid, Image as ImageIcon,
  Type, Wand2, FileImage, FileText, Presentation, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import PosterCanvas from '@/components/poster/PosterCanvas';
import {
  PLATFORM_PRESETS, DESIGN_TYPES, VISUAL_STYLES,
  TEMPLATES, getCompatibleTemplates,
} from '@/lib/poster/presets';
import { exportToPng, exportToJpg, exportToPdf, exportToPptx } from '@/lib/poster/exportUtils';
import { buildPosterImagePrompt } from '@/lib/poster/promptBuilder';

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
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Get current selections
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

  // Auto-switch template when platform group changes
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
      // Build prompt for AI background generation
      const prompt = buildPosterImagePrompt(formData, style);

      // Call Gemini to generate a background image description,
      // then use a gradient placeholder for now
      // In production, this would call an image generation API
      console.log('AI Prompt:', prompt);

      // Simulate generation delay
      await new Promise(r => setTimeout(r, 1200));

      // For now, use the style gradient as background
      // Future: plug in actual AI image generation here
      setBgImage(null);
    } catch (err) {
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  }

  function handleChangeLayout() {
    const idx = compatibleTemplates.findIndex(t => t.id === templateId);
    const next = (idx + 1) % compatibleTemplates.length;
    setTemplateId(compatibleTemplates[next].id);
  }

  function handleReset() {
    setFormData(INITIAL_FORM);
    setBgImage(null);
    setTemplateId('sq-center');
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
      <main className="poster-page">
        {/* Header */}
        <div className="poster-header fade-up">
          <div>
            <h1 className="poster-page-title">
              <Wand2 size={28} /> AI Poster Generator
            </h1>
            <p className="poster-page-sub">สร้างโปสเตอร์และแบนเนอร์อัตโนมัติจากข้อความสำคัญ</p>
          </div>
        </div>

        <div className="poster-layout">
          {/* ========== LEFT PANEL — FORM ========== */}
          <div className="poster-panel poster-form-panel fade-up">

            {/* Platform Preset */}
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

            {/* Text Fields */}
            <div className="poster-section">
              <label className="poster-label">
                <Type size={15} /> ข้อความ
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
                <input className="poster-input" placeholder="#Hashtags (ไม่บังคับ)" value={formData.hashtags}
                  onChange={e => updateField('hashtags', e.target.value)} />
              </div>
            </div>

            {/* Actions */}
            <div className="poster-section poster-actions">
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
                <button className="poster-btn poster-btn-ghost" onClick={handleGenerate} disabled={generating} type="button">
                  <ImageIcon size={14} /> สร้างภาพใหม่
                </button>
                <button className="poster-btn poster-btn-danger" onClick={handleReset} type="button">
                  <RefreshCw size={14} /> ล้าง
                </button>
              </div>
            </div>
          </div>

          {/* ========== RIGHT PANEL — PREVIEW ========== */}
          <div className="poster-panel poster-preview-panel fade-up" style={{ animationDelay: '0.1s' }}>
            {/* Info bar */}
            <div className="poster-info-bar">
              <span>{preset.name} · {preset.w}x{preset.h}</span>
              <span>เลย์เอาต์: {template.name}</span>
              <button
                className="poster-debug-toggle"
                onClick={() => setShowDebug(!showDebug)}
                title="Debug safe areas"
                type="button"
              >
                {showDebug ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              </button>
            </div>

            {/* Canvas */}
            <div className="poster-canvas-wrapper">
              <PosterCanvas
                formData={formData}
                template={template}
                style={style}
                preset={preset}
                bgImage={bgImage}
                showDebug={showDebug}
              />
            </div>

            {/* Export */}
            <div className="poster-export-section">
              <label className="poster-label"><Download size={15} /> ดาวน์โหลดผลงาน</label>
              <div className="poster-export-grid">
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
