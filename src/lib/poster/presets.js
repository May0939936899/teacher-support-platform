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
  // --- 4 Light Pastel ---
  {
    id: 'pastel-sky',
    label: 'Pastel Sky',
    gradient: 'linear-gradient(135deg, #E0F4FF 0%, #BDE0FE 50%, #A2D2FF 100%)',
    accent: '#3B82F6',
    overlay: 'rgba(255,255,255,0.15)',
    promptMod: 'soft pastel sky blue, airy, calm, light',
  },
  {
    id: 'pastel-peach',
    label: 'Pastel Peach',
    gradient: 'linear-gradient(135deg, #FFF0E5 0%, #FFD6BA 50%, #FFCBA4 100%)',
    accent: '#F97316',
    overlay: 'rgba(255,255,255,0.15)',
    promptMod: 'warm pastel peach, friendly, inviting, soft',
  },
  {
    id: 'pastel-mint',
    label: 'Pastel Mint',
    gradient: 'linear-gradient(135deg, #E8FFF1 0%, #B5F5CC 50%, #95EDBA 100%)',
    accent: '#10B981',
    overlay: 'rgba(255,255,255,0.15)',
    promptMod: 'fresh pastel mint green, nature, refreshing',
  },
  {
    id: 'pastel-lavender',
    label: 'Pastel Lavender',
    gradient: 'linear-gradient(135deg, #F3E8FF 0%, #DDD6FE 50%, #C4B5FD 100%)',
    accent: '#8B5CF6',
    overlay: 'rgba(255,255,255,0.15)',
    promptMod: 'soft pastel lavender purple, dreamy, elegant',
  },
  // --- 4 Dark Pastel ---
  {
    id: 'dark-ocean',
    label: 'Dark Ocean',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #2A5080 50%, #1B3D6D 100%)',
    accent: '#60A5FA',
    overlay: 'rgba(0,0,0,0.3)',
    promptMod: 'deep ocean blue, professional, dark pastel',
  },
  {
    id: 'dark-plum',
    label: 'Dark Plum',
    gradient: 'linear-gradient(135deg, #3B1F4A 0%, #5B3468 50%, #472552 100%)',
    accent: '#C084FC',
    overlay: 'rgba(0,0,0,0.3)',
    promptMod: 'dark plum purple, rich, sophisticated, muted',
  },
  {
    id: 'dark-forest',
    label: 'Dark Forest',
    gradient: 'linear-gradient(135deg, #1A3328 0%, #2D5040 50%, #1E3F30 100%)',
    accent: '#34D399',
    overlay: 'rgba(0,0,0,0.3)',
    promptMod: 'dark forest green, earthy, deep, natural',
  },
  {
    id: 'dark-charcoal',
    label: 'Dark Charcoal',
    gradient: 'linear-gradient(135deg, #2D2D3A 0%, #3D3D50 50%, #2A2A38 100%)',
    accent: '#F9A8D4',
    overlay: 'rgba(0,0,0,0.25)',
    promptMod: 'dark charcoal, modern, minimalist, pink accent',
  },
];

// ===================================================
// Templates — Locked text-safe block system
// 10+ layouts per group for rich variety
// ===================================================

export const TEMPLATES = [
  // ========================================
  // SQUARE LAYOUTS (10)
  // ========================================
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
  {
    id: 'sq-top-bold',
    name: 'Top Bold',
    group: 'square',
    blocks: {
      title:    { x: '8%',  y: '8%',  w: '84%', h: 'auto', align: 'center', maxFont: 46, minFont: 26, weight: 900 },
      subtitle: { x: '10%', y: '28%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '10%', y: '42%', w: '80%', h: 'auto', align: 'center', maxFont: 18, minFont: 13, weight: 600 },
      info:     { x: '10%', y: '55%', w: '80%', h: 'auto', align: 'center', maxFont: 15, minFont: 11, weight: 400 },
      cta:      { x: '20%', y: '70%', w: '60%', h: 'auto', align: 'center', maxFont: 18, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-diagonal',
    name: 'Diagonal Split',
    group: 'square',
    blocks: {
      title:    { x: '5%',  y: '10%', w: '55%', h: 'auto', align: 'left', maxFont: 38, minFont: 22, weight: 800 },
      subtitle: { x: '5%',  y: '32%', w: '50%', h: 'auto', align: 'left', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '40%', y: '55%', w: '55%', h: 'auto', align: 'right', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '40%', y: '68%', w: '55%', h: 'auto', align: 'right', maxFont: 14, minFont: 11, weight: 400 },
      cta:      { x: '40%', y: '82%', w: '55%', h: 'auto', align: 'right', maxFont: 17, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-right-panel',
    name: 'Right Panel',
    group: 'square',
    blocks: {
      title:    { x: '40%', y: '15%', w: '55%', h: 'auto', align: 'right', maxFont: 38, minFont: 22, weight: 800 },
      subtitle: { x: '40%', y: '38%', w: '55%', h: 'auto', align: 'right', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '40%', y: '52%', w: '55%', h: 'auto', align: 'right', maxFont: 18, minFont: 13, weight: 600 },
      info:     { x: '40%', y: '65%', w: '55%', h: 'auto', align: 'right', maxFont: 14, minFont: 11, weight: 400 },
      cta:      { x: '45%', y: '80%', w: '48%', h: 'auto', align: 'right', maxFont: 17, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-magazine',
    name: 'Magazine',
    group: 'square',
    blocks: {
      title:    { x: '6%',  y: '6%',  w: '88%', h: 'auto', align: 'left', maxFont: 48, minFont: 28, weight: 900 },
      subtitle: { x: '6%',  y: '26%', w: '70%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '6%',  y: '80%', w: '50%', h: 'auto', align: 'left', maxFont: 18, minFont: 13, weight: 700 },
      info:     { x: '6%',  y: '88%', w: '88%', h: 'auto', align: 'left', maxFont: 12, minFont: 10, weight: 400 },
      cta:      { x: '55%', y: '80%', w: '40%', h: 'auto', align: 'right', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-overlay',
    name: 'Overlay Card',
    group: 'square',
    blocks: {
      title:    { x: '10%', y: '30%', w: '80%', h: 'auto', align: 'center', maxFont: 44, minFont: 26, weight: 800 },
      subtitle: { x: '10%', y: '50%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 400 },
      speaker:  { x: '15%', y: '62%', w: '70%', h: 'auto', align: 'center', maxFont: 18, minFont: 13, weight: 600 },
      info:     { x: '15%', y: '72%', w: '70%', h: 'auto', align: 'center', maxFont: 14, minFont: 11, weight: 400 },
      cta:      { x: '25%', y: '84%', w: '50%', h: 'auto', align: 'center', maxFont: 16, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-two-col',
    name: 'Two Column',
    group: 'square',
    blocks: {
      title:    { x: '5%',  y: '8%',  w: '90%', h: 'auto', align: 'center', maxFont: 36, minFont: 22, weight: 800 },
      subtitle: { x: '5%',  y: '28%', w: '45%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '52%', y: '28%', w: '45%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '5%',  y: '70%', w: '90%', h: 'auto', align: 'center', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '20%', y: '82%', w: '60%', h: 'auto', align: 'center', maxFont: 18, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'sq-minimal',
    name: 'Minimal Clean',
    group: 'square',
    blocks: {
      title:    { x: '12%', y: '35%', w: '76%', h: 'auto', align: 'center', maxFont: 40, minFont: 24, weight: 700 },
      subtitle: { x: '15%', y: '52%', w: '70%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 300 },
      speaker:  { x: '15%', y: '64%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 500 },
      info:     { x: '20%', y: '75%', w: '60%', h: 'auto', align: 'center', maxFont: 13, minFont: 10, weight: 400 },
      cta:      { x: '30%', y: '88%', w: '40%', h: 'auto', align: 'center', maxFont: 15, minFont: 12, weight: 600, isCta: true },
    },
  },

  // ========================================
  // VERTICAL LAYOUTS (10)
  // ========================================
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
  {
    id: 'vt-hero-top',
    name: 'Hero Top',
    group: 'vertical',
    blocks: {
      title:    { x: '6%',  y: '5%',  w: '88%', h: 'auto', align: 'center', maxFont: 50, minFont: 30, weight: 900 },
      subtitle: { x: '8%',  y: '18%', w: '84%', h: 'auto', align: 'center', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '8%',  y: '70%', w: '84%', h: 'auto', align: 'center', maxFont: 22, minFont: 14, weight: 600 },
      info:     { x: '8%',  y: '78%', w: '84%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 400 },
      cta:      { x: '15%', y: '88%', w: '70%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-left-stack',
    name: 'Left Stack',
    group: 'vertical',
    blocks: {
      title:    { x: '6%',  y: '15%', w: '65%', h: 'auto', align: 'left', maxFont: 42, minFont: 24, weight: 800 },
      subtitle: { x: '6%',  y: '32%', w: '60%', h: 'auto', align: 'left', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '6%',  y: '55%', w: '60%', h: 'auto', align: 'left', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '6%',  y: '65%', w: '60%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 400 },
      cta:      { x: '6%',  y: '85%', w: '50%', h: 'auto', align: 'left', maxFont: 18, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-center-card',
    name: 'Center Card',
    group: 'vertical',
    blocks: {
      title:    { x: '10%', y: '25%', w: '80%', h: 'auto', align: 'center', maxFont: 42, minFont: 24, weight: 800 },
      subtitle: { x: '10%', y: '40%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '10%', y: '52%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '10%', y: '62%', w: '80%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 400 },
      cta:      { x: '20%', y: '74%', w: '60%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-bottom-stack',
    name: 'Bottom Stack',
    group: 'vertical',
    blocks: {
      title:    { x: '8%',  y: '60%', w: '84%', h: 'auto', align: 'left', maxFont: 44, minFont: 26, weight: 800 },
      subtitle: { x: '8%',  y: '72%', w: '84%', h: 'auto', align: 'left', maxFont: 20, minFont: 13, weight: 400 },
      speaker:  { x: '8%',  y: '80%', w: '55%', h: 'auto', align: 'left', maxFont: 18, minFont: 12, weight: 600 },
      info:     { x: '8%',  y: '86%', w: '84%', h: 'auto', align: 'left', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '55%', y: '80%', w: '38%', h: 'auto', align: 'right', maxFont: 17, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-right-align',
    name: 'Right Align',
    group: 'vertical',
    blocks: {
      title:    { x: '30%', y: '12%', w: '65%', h: 'auto', align: 'right', maxFont: 42, minFont: 24, weight: 800 },
      subtitle: { x: '30%', y: '30%', w: '65%', h: 'auto', align: 'right', maxFont: 18, minFont: 12, weight: 400 },
      speaker:  { x: '30%', y: '55%', w: '65%', h: 'auto', align: 'right', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '30%', y: '66%', w: '65%', h: 'auto', align: 'right', maxFont: 15, minFont: 11, weight: 400 },
      cta:      { x: '40%', y: '85%', w: '55%', h: 'auto', align: 'right', maxFont: 18, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-cinematic',
    name: 'Cinematic',
    group: 'vertical',
    blocks: {
      title:    { x: '5%',  y: '38%', w: '90%', h: 'auto', align: 'center', maxFont: 52, minFont: 30, weight: 900 },
      subtitle: { x: '10%', y: '52%', w: '80%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 300 },
      speaker:  { x: '10%', y: '75%', w: '80%', h: 'auto', align: 'center', maxFont: 20, minFont: 14, weight: 600 },
      info:     { x: '10%', y: '83%', w: '80%', h: 'auto', align: 'center', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '20%', y: '92%', w: '60%', h: 'auto', align: 'center', maxFont: 17, minFont: 13, weight: 700, isCta: true },
    },
  },
  {
    id: 'vt-minimal',
    name: 'Minimal Story',
    group: 'vertical',
    blocks: {
      title:    { x: '12%', y: '30%', w: '76%', h: 'auto', align: 'center', maxFont: 40, minFont: 24, weight: 700 },
      subtitle: { x: '15%', y: '45%', w: '70%', h: 'auto', align: 'center', maxFont: 18, minFont: 12, weight: 300 },
      speaker:  { x: '15%', y: '58%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 500 },
      info:     { x: '15%', y: '68%', w: '70%', h: 'auto', align: 'center', maxFont: 14, minFont: 10, weight: 400 },
      cta:      { x: '25%', y: '82%', w: '50%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 600, isCta: true },
    },
  },

  // ========================================
  // HORIZONTAL LAYOUTS (10)
  // ========================================
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
  {
    id: 'hz-split-left',
    name: 'Split Left',
    group: 'horizontal',
    blocks: {
      title:    { x: '4%',  y: '12%', w: '45%', h: 'auto', align: 'left', maxFont: 32, minFont: 18, weight: 800 },
      subtitle: { x: '4%',  y: '38%', w: '45%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '4%',  y: '55%', w: '45%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 600 },
      info:     { x: '4%',  y: '68%', w: '45%', h: 'auto', align: 'left', maxFont: 13, minFont: 10, weight: 400 },
      cta:      { x: '4%',  y: '82%', w: '40%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-bold-center',
    name: 'Bold Center',
    group: 'horizontal',
    blocks: {
      title:    { x: '10%', y: '15%', w: '80%', h: 'auto', align: 'center', maxFont: 40, minFont: 22, weight: 900 },
      subtitle: { x: '15%', y: '42%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '15%', y: '56%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '20%', y: '70%', w: '60%', h: 'auto', align: 'center', maxFont: 13, minFont: 10, weight: 400 },
      cta:      { x: '30%', y: '84%', w: '40%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-thirds',
    name: 'Thirds Grid',
    group: 'horizontal',
    blocks: {
      title:    { x: '3%',  y: '15%', w: '35%', h: 'auto', align: 'left', maxFont: 30, minFont: 18, weight: 800 },
      subtitle: { x: '3%',  y: '42%', w: '35%', h: 'auto', align: 'left', maxFont: 14, minFont: 10, weight: 400 },
      speaker:  { x: '40%', y: '15%', w: '25%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '40%', y: '42%', w: '25%', h: 'auto', align: 'center', maxFont: 12, minFont: 9, weight: 400 },
      cta:      { x: '68%', y: '30%', w: '28%', h: 'auto', align: 'center', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-cinematic',
    name: 'Cinematic Wide',
    group: 'horizontal',
    blocks: {
      title:    { x: '5%',  y: '25%', w: '90%', h: 'auto', align: 'center', maxFont: 38, minFont: 22, weight: 900 },
      subtitle: { x: '15%', y: '50%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 300 },
      speaker:  { x: '5%',  y: '70%', w: '40%', h: 'auto', align: 'left', maxFont: 14, minFont: 10, weight: 600 },
      info:     { x: '55%', y: '70%', w: '40%', h: 'auto', align: 'right', maxFont: 12, minFont: 9, weight: 400 },
      cta:      { x: '35%', y: '85%', w: '30%', h: 'auto', align: 'center', maxFont: 14, minFont: 11, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-lower-third',
    name: 'Lower Third',
    group: 'horizontal',
    blocks: {
      title:    { x: '5%',  y: '50%', w: '55%', h: 'auto', align: 'left', maxFont: 34, minFont: 18, weight: 800 },
      subtitle: { x: '5%',  y: '68%', w: '55%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '65%', y: '50%', w: '30%', h: 'auto', align: 'right', maxFont: 16, minFont: 11, weight: 600 },
      info:     { x: '5%',  y: '80%', w: '55%', h: 'auto', align: 'left', maxFont: 12, minFont: 9, weight: 400 },
      cta:      { x: '65%', y: '70%', w: '30%', h: 'auto', align: 'right', maxFont: 15, minFont: 11, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-top-strip',
    name: 'Top Strip',
    group: 'horizontal',
    blocks: {
      title:    { x: '5%',  y: '8%',  w: '60%', h: 'auto', align: 'left', maxFont: 36, minFont: 20, weight: 800 },
      subtitle: { x: '5%',  y: '32%', w: '55%', h: 'auto', align: 'left', maxFont: 16, minFont: 11, weight: 400 },
      speaker:  { x: '5%',  y: '50%', w: '50%', h: 'auto', align: 'left', maxFont: 15, minFont: 11, weight: 600 },
      info:     { x: '5%',  y: '65%', w: '50%', h: 'auto', align: 'left', maxFont: 13, minFont: 10, weight: 400 },
      cta:      { x: '60%', y: '65%', w: '35%', h: 'auto', align: 'right', maxFont: 16, minFont: 12, weight: 700, isCta: true },
    },
  },
  {
    id: 'hz-minimal',
    name: 'Minimal Wide',
    group: 'horizontal',
    blocks: {
      title:    { x: '10%', y: '30%', w: '80%', h: 'auto', align: 'center', maxFont: 36, minFont: 20, weight: 700 },
      subtitle: { x: '15%', y: '52%', w: '70%', h: 'auto', align: 'center', maxFont: 16, minFont: 11, weight: 300 },
      speaker:  { x: '20%', y: '65%', w: '60%', h: 'auto', align: 'center', maxFont: 14, minFont: 10, weight: 500 },
      info:     { x: '25%', y: '76%', w: '50%', h: 'auto', align: 'center', maxFont: 12, minFont: 9, weight: 400 },
      cta:      { x: '35%', y: '87%', w: '30%', h: 'auto', align: 'center', maxFont: 14, minFont: 11, weight: 600, isCta: true },
    },
  },
];

export function getCompatibleTemplates(presetId) {
  const preset = PLATFORM_PRESETS.find(p => p.id === presetId);
  if (!preset) return TEMPLATES;
  return TEMPLATES.filter(t => t.group === preset.group);
}
