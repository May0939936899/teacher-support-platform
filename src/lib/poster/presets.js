// ===================================================
// Platform Presets — Canvas sizes & safe areas
// ===================================================

export const PLATFORM_PRESETS = [
  { id: 'fb-post',    name: 'Facebook Post',    w: 1200, h: 1200, icon: '📘', group: 'square' },
  { id: 'fb-cover',   name: 'Facebook Cover',   w: 1640, h: 624,  icon: '📘', group: 'horizontal' },
  { id: 'ig-post',    name: 'Instagram Post',   w: 1080, h: 1080, icon: '📸', group: 'square' },
  { id: 'ig-story',   name: 'Instagram Story',  w: 1080, h: 1920, icon: '📸', group: 'vertical' },
  { id: 'tiktok',     name: 'TikTok Story',     w: 1080, h: 1920, icon: '🎵', group: 'vertical' },
  { id: 'yt-thumb',   name: 'YouTube Thumbnail',w: 1280, h: 720,  icon: '▶️', group: 'horizontal' },
  { id: 'line-banner', name: 'LINE Banner',     w: 1200, h: 628,  icon: '💬', group: 'horizontal' },
  { id: 'lemon8',     name: 'Lemon8 Cover',     w: 1242, h: 1660, icon: '🍋', group: 'vertical' },
];

// ===================================================
// Design Types
// ===================================================

export const DESIGN_TYPES = [
  { id: 'event',       label: 'โปสเตอร์อีเวนต์',       promptHint: 'event promotion, conference stage, vibrant' },
  { id: 'workshop',    label: 'โปสเตอร์เวิร์กชอป',     promptHint: 'workshop, hands-on learning, collaborative' },
  { id: 'course',      label: 'โปรโมตหลักสูตร',        promptHint: 'education, course promotion, academic excellence' },
  { id: 'speaker',     label: 'โปสเตอร์วิทยากร',       promptHint: 'keynote speaker, professional, spotlight' },
  { id: 'openhouse',   label: 'Open House แบนเนอร์',   promptHint: 'university open house, welcoming, campus tour' },
  { id: 'recruitment', label: 'รับสมัครนักศึกษา',       promptHint: 'recruitment, youth energy, future career' },
  { id: 'seminar',     label: 'สัมมนาธุรกิจ',          promptHint: 'business seminar, corporate, professional stage' },
  { id: 'general',     label: 'ประกาศทั่วไป',           promptHint: 'general announcement, clean, informational' },
];

// ===================================================
// Visual Styles
// ===================================================

export const VISUAL_STYLES = [
  {
    id: 'modern-biz',
    label: 'Modern Business',
    gradient: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
    accent: '#00ADEF',
    overlay: 'rgba(0,0,0,0.35)',
    promptMod: 'modern business, clean corporate, blue tones',
  },
  {
    id: 'ai-futuristic',
    label: 'AI Futuristic',
    gradient: 'linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 40%, #2d1b69 100%)',
    accent: '#8B5CF6',
    overlay: 'rgba(10,10,46,0.45)',
    promptMod: 'futuristic AI, digital neural network, neon purple',
  },
  {
    id: 'minimal-premium',
    label: 'Minimal Premium',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    accent: '#F5F5F5',
    overlay: 'rgba(0,0,0,0.25)',
    promptMod: 'minimalist, premium, elegant simplicity, dark',
  },
  {
    id: 'elegant-academic',
    label: 'Elegant Academic',
    gradient: 'linear-gradient(135deg, #1B1F3B 0%, #2E3A59 50%, #3D4F7C 100%)',
    accent: '#FFD700',
    overlay: 'rgba(27,31,59,0.4)',
    promptMod: 'academic, university, elegant gold accents',
  },
  {
    id: 'youth-creative',
    label: 'Youthful Creative',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
    accent: '#FF6B6B',
    overlay: 'rgba(0,0,0,0.3)',
    promptMod: 'youthful, colorful, creative energy, vibrant',
  },
  {
    id: 'bold-event',
    label: 'Bold Event',
    gradient: 'linear-gradient(135deg, #E3007E 0%, #FF4081 50%, #FF6B35 100%)',
    accent: '#FFD700',
    overlay: 'rgba(0,0,0,0.35)',
    promptMod: 'bold event, high energy, dynamic, red pink',
  },
  {
    id: 'spu-brand',
    label: 'SPU Corporate',
    gradient: 'linear-gradient(135deg, #004175 0%, #00ADEF 100%)',
    accent: '#E3007E',
    overlay: 'rgba(0,65,117,0.4)',
    promptMod: 'corporate blue, university branding, professional',
  },
];

// ===================================================
// Templates — Locked text-safe block system
// ===================================================

export const TEMPLATES = [
  // --- SQUARE ---
  {
    id: 'sq-center',
    name: 'Center Focus',
    group: 'square',
    blocks: {
      title:    { x: '10%', y: '20%', w: '80%', h: 'auto', align: 'center', maxFont: 42, minFont: 24, weight: 800 },
      subtitle: { x: '10%', y: '42%', w: '80%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 400 },
      speaker:  { x: '10%', y: '56%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '10%', y: '68%', w: '80%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 400 },
      cta:      { x: '20%', y: '82%', w: '60%', h: 'auto', align: 'center', maxFont: 18, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-left',
    name: 'Left Aligned',
    group: 'square',
    blocks: {
      title:    { x: '8%',  y: '18%', w: '60%', h: 'auto', align: 'left', maxFont: 40, minFont: 22, weight: 800 },
      subtitle: { x: '8%',  y: '42%', w: '55%', h: 'auto', align: 'left', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '8%',  y: '56%', w: '55%', h: 'auto', align: 'left', maxFont: 18, minFont: 13, weight: 600 },
      info:     { x: '8%',  y: '68%', w: '55%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 400 },
      cta:      { x: '8%',  y: '84%', w: '45%', h: 'auto', align: 'left', maxFont: 17, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-bottom',
    name: 'Bottom Heavy',
    group: 'square',
    blocks: {
      title:    { x: '8%',  y: '50%', w: '84%', h: 'auto', align: 'left', maxFont: 38, minFont: 22, weight: 800 },
      subtitle: { x: '8%',  y: '65%', w: '84%', h: 'auto', align: 'left', maxFont: 18, minFont: 13, weight: 400 },
      speaker:  { x: '8%',  y: '74%', w: '50%', h: 'auto', align: 'left', maxFont: 16, minFont: 12, weight: 600 },
      info:     { x: '8%',  y: '82%', w: '84%', h: 'auto', align: 'left', maxFont: 14, minFont: 11, weight: 400 },
      cta:      { x: '55%', y: '82%', w: '38%', h: 'auto', align: 'right',maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },

  // --- VERTICAL ---
  {
    id: 'vt-classic',
    name: 'Classic Vertical',
    group: 'vertical',
    blocks: {
      title:    { x: '8%',  y: '12%', w: '84%', h: 'auto', align: 'center', maxFont: 44, minFont: 26, weight: 800 },
      subtitle: { x: '10%', y: '28%', w: '80%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 400 },
      speaker:  { x: '10%', y: '50%', w: '80%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 600 },
      info:     { x: '10%', y: '62%', w: '80%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 400 },
      cta:      { x: '15%', y: '80%', w: '70%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-split',
    name: 'Split Vertical',
    group: 'vertical',
    blocks: {
      title:    { x: '8%',  y: '55%', w: '84%', h: 'auto', align: 'left', maxFont: 40, minFont: 24, weight: 800 },
      subtitle: { x: '8%',  y: '67%', w: '84%', h: 'auto', align: 'left', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '8%',  y: '76%', w: '50%', h: 'auto', align: 'left', maxFont: 18, minFont: 13, weight: 600 },
      info:     { x: '8%',  y: '83%', w: '84%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 400 },
      cta:      { x: '8%',  y: '91%', w: '84%', h: 'auto', align: 'center', maxFont: 18, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-bold',
    name: 'Bold Vertical',
    group: 'vertical',
    blocks: {
      title:    { x: '6%',  y: '8%',  w: '88%', h: 'auto', align: 'center', maxFont: 48, minFont: 28, weight: 900 },
      subtitle: { x: '8%',  y: '25%', w: '84%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 400 },
      speaker:  { x: '10%', y: '45%', w: '80%', h: 'auto', align: 'center', maxFont: 24, minFont: 16, weight: 700 },
      info:     { x: '10%', y: '58%', w: '80%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 400 },
      cta:      { x: '15%', y: '85%', w: '70%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 700, isCta: true },
    },
  },

  // --- HORIZONTAL ---
  {
    id: 'hz-left',
    name: 'Left Content',
    group: 'horizontal',
    blocks: {
      title:    { x: '5%',  y: '18%', w: '50%', h: 'auto', align: 'left', maxFont: 36, minFont: 20, weight: 800 },
      subtitle: { x: '5%',  y: '42%', w: '50%', h: 'auto', align: 'left', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '5%',  y: '56%', w: '45%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '5%',  y: '68%', w: '45%', h: 'auto', align: 'left', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '5%',  y: '82%', w: '35%', h: 'auto', align: 'left', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-center',
    name: 'Center Banner',
    group: 'horizontal',
    blocks: {
      title:    { x: '15%', y: '20%', w: '70%', h: 'auto', align: 'center', maxFont: 34, minFont: 20, weight: 800 },
      subtitle: { x: '15%', y: '44%', w: '70%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '15%', y: '58%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '25%', y: '70%', w: '50%', h: 'auto', align: 'center', maxFont: 13, minFont: 10, weight: 400 },
      cta:      { x: '30%', y: '82%', w: '40%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-right',
    name: 'Right Content',
    group: 'horizontal',
    blocks: {
      title:    { x: '45%', y: '18%', w: '50%', h: 'auto', align: 'right', maxFont: 34, minFont: 20, weight: 800 },
      subtitle: { x: '45%', y: '42%', w: '50%', h: 'auto', align: 'right', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '45%', y: '56%', w: '50%', h: 'auto', align: 'right', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '45%', y: '68%', w: '50%', h: 'auto', align: 'right', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '55%', y: '82%', w: '38%', h: 'auto', align: 'right', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
];

export function getCompatibleTemplates(presetId) {
  const preset = PLATFORM_PRESETS.find(p => p.id === presetId);
  if (!preset) return TEMPLATES;
  return TEMPLATES.filter(t => t.group === preset.group);
}
