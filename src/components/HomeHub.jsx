'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  ImageIcon, Wand2, ArrowRight, Sparkles, Zap,
  FileImage, PenTool, Download, Share2,
  Hash, Type, Palette, Layers, Star, TrendingUp,
} from 'lucide-react';
import BtsHeroScene from '@/components/BtsHeroScene';

// Floating decoration data
const FLOATERS = [
  { emoji: '📱', top: '8%',  left: '4%',  size: 38, delay: 0,    dur: 6 },
  { emoji: '✨', top: '15%', left: '18%', size: 28, delay: 0.8,  dur: 5 },
  { emoji: '🎨', top: '6%',  left: '78%', size: 36, delay: 1.2,  dur: 7 },
  { emoji: '📊', top: '20%', left: '92%', size: 30, delay: 0.3,  dur: 5.5 },
  { emoji: '💡', top: '72%', left: '3%',  size: 32, delay: 1.5,  dur: 6.5 },
  { emoji: '🚀', top: '80%', left: '88%', size: 34, delay: 0.6,  dur: 5 },
  { emoji: '📢', top: '88%', left: '22%', size: 30, delay: 1,    dur: 7 },
  { emoji: '🎯', top: '75%', left: '72%', size: 28, delay: 0.4,  dur: 6 },
  { emoji: '#️⃣', top: '42%', left: '1%',  size: 26, delay: 2,    dur: 5.5 },
  { emoji: '🌟', top: '38%', left: '95%', size: 26, delay: 1.8,  dur: 6 },
];

const PLATFORM_BADGES = [
  { name: 'Facebook',  color: '#1877F2', bg: '#e8f0fe', icon: '📘' },
  { name: 'Instagram', color: '#E1306C', bg: '#fce8f0', icon: '📸' },
  { name: 'TikTok',    color: '#000',    bg: '#f0f0f0', icon: '🎵' },
  { name: 'LINE',      color: '#06C755', bg: '#e6faf0', icon: '💬' },
  { name: 'YouTube',   color: '#FF0000', bg: '#fde8e8', icon: '▶️' },
  { name: 'Lemon8',    color: '#F0C800', bg: '#fefce6', icon: '🍋' },
];

const STATS = [
  { icon: <Layers size={18} />,    value: '6',       label: 'แพลตฟอร์ม',    color: '#00ADEF' },
  { icon: <Sparkles size={18} />,  value: 'AI',      label: 'สร้างเนื้อหา', color: '#8b5cf6' },
  { icon: <PenTool size={18} />,   value: '∞',       label: 'สไตล์โปสเตอร์', color: '#E3007E' },
  { icon: <Download size={18} />,  value: '4',       label: 'รูปแบบดาวน์โหลด', color: '#059669' },
];

export default function HomeHub() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const firstName = profile?.full_name?.split(' ')[0] || 'คุณ';

  return (
    <div className="hub-container">

      {/* Floating emoji decorations */}
      <div className="hub-floaters" aria-hidden="true">
        {FLOATERS.map((f, i) => (
          <div
            key={i}
            className="hub-floater"
            style={{
              top: f.top, left: f.left,
              fontSize: f.size,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.dur}s`,
            }}
          >
            {f.emoji}
          </div>
        ))}
      </div>

      {/* Decorative hash tags background */}
      <div className="hub-bg-tags" aria-hidden="true">
        {['#ContentMarketing','AI-Powered','#SPUBizContent','#โปสเตอร์','Poster Studio','#สร้างแคปชั่น','Facebook · Instagram','#DigitalMarketing','AI Content','#TikTok'].map((tag, i) => (
          <span key={i} className="hub-bg-tag" style={{ animationDelay: `${i * 0.3}s` }}>
            {tag}
          </span>
        ))}
      </div>

      {/* ===== HEADER ===== */}
      <div className="hub-header fade-up">
        <div className="hub-badge">
          <Sparkles size={13} />
          <span>AI-Powered Platform</span>
        </div>
        <div className="hub-logo-mark">
          <span className="hub-logo-spu">SPUBUS</span>
          <span className="hub-logo-biz"> BiZ</span>
          <span className="hub-logo-content"> CONTENT</span>
        </div>
        <p className="hub-tagline">
          สร้างคอนเทนต์มืออาชีพ · ด้วย AI · ในไม่กี่วินาที
        </p>
        <p className="hub-greeting">
          สวัสดี <strong>{firstName}</strong> — เลือกเครื่องมือที่ต้องการ
        </p>
      </div>

      {/* ===== PLATFORM BADGES ===== */}
      <div className="hub-platforms fade-up" style={{ animationDelay: '0.1s' }}>
        {PLATFORM_BADGES.map(p => (
          <div key={p.name} className="hub-platform-badge" style={{ background: p.bg, color: p.color }}>
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </div>
        ))}
      </div>

      {/* ===== MAIN CARDS ===== */}
      <div className="hub-cards fade-up" style={{ animationDelay: '0.2s' }}>

        {/* Card 1: Content */}
        <button className="hub-card hub-card-content" onClick={() => router.push('/content')}>
          <div className="hub-card-blob hub-blob-1" />
          <div className="hub-card-blob hub-blob-2" />
          <div className="hub-card-inner">
            <div className="hub-card-top">
              <div className="hub-card-icon-wrap">
                <ImageIcon size={34} strokeWidth={1.5} />
              </div>
              <div className="hub-card-arrow-btn"><ArrowRight size={20} /></div>
            </div>
            <h2 className="hub-card-title">ทำคอนเทนต์<br />จากภาพ</h2>
            <p className="hub-card-desc">
              อัปโหลดรูปภาพ · AI สร้างแคปชั่น<br />พร้อมโพสต์ทุกแพลตฟอร์ม
            </p>
            <div className="hub-card-features">
              <div className="hub-feature-item"><FileImage size={13} /><span>อัปโหลดรูป</span></div>
              <div className="hub-feature-item"><Sparkles size={13} /><span>AI เขียนให้</span></div>
              <div className="hub-feature-item"><Share2 size={13} /><span>โพสต์ได้เลย</span></div>
            </div>
            <div className="hub-card-cta">เริ่มสร้างคอนเทนต์ <ArrowRight size={16} /></div>
          </div>
        </button>

        {/* Card 2: Poster */}
        <div className="hub-card hub-card-poster" style={{ opacity: 0.55, cursor: 'not-allowed', position: 'relative' }}>
          <div className="hub-card-blob hub-blob-3" />
          <div className="hub-card-blob hub-blob-4" />
          <div className="hub-card-inner">
            <div className="hub-card-top">
              <div className="hub-card-icon-wrap">
                <Wand2 size={34} strokeWidth={1.5} />
              </div>
              <div className="hub-card-arrow-btn" style={{ opacity: 0.3 }}><ArrowRight size={20} /></div>
            </div>
            <h2 className="hub-card-title">สร้างภาพ<br />/ โปสเตอร์</h2>
            <p className="hub-card-desc">
              ออกแบบโปสเตอร์สวย · เลือกสไตล์<br />ดาวน์โหลด PNG, PDF, PPTX
            </p>
            <div className="hub-card-features">
              <div className="hub-feature-item"><PenTool size={13} /><span>ออกแบบ AI</span></div>
              <div className="hub-feature-item"><Zap size={13} /><span>หลายขนาด</span></div>
              <div className="hub-feature-item"><Download size={13} /><span>ดาวน์โหลด</span></div>
            </div>
            <div className="hub-card-cta" style={{ opacity: 0.5 }}>🔧 กำลังปรับปรุง...</div>
          </div>
        </div>

      </div>

      {/* ===== STATS BAR ===== */}
      <div className="hub-stats fade-up" style={{ animationDelay: '0.3s' }}>
        {STATS.map((s, i) => (
          <div key={i} className="hub-stat-item">
            <div className="hub-stat-icon" style={{ color: s.color, background: s.color + '18' }}>
              {s.icon}
            </div>
            <div className="hub-stat-text">
              <span className="hub-stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="hub-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== BTS TRAIN SCENE ===== */}
      <div style={{ width:'100vw', marginLeft:'calc(-50vw + 50%)', marginTop:'24px', overflow:'hidden' }}>
        <BtsHeroScene />
      </div>

      {/* ===== FOOTER ===== */}
      <div className="hub-footer fade-up" style={{ animationDelay: '0.4s' }}>
        <p>SPUBUS · คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
      </div>

    </div>
  );
}
