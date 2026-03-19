'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ImageIcon, Wand2, ArrowRight, Zap, GraduationCap } from 'lucide-react';

export default function HomeHub() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const firstName = profile?.full_name?.split(' ')[0] || 'คุณ';

  return (
    <div className="hub-container">
      {/* Animated gradient background */}
      <div className="hub-bg-gradient" />
      <div className="hub-bg-grid" />
      <div className="hub-bg-glow hub-glow-1" />
      <div className="hub-bg-glow hub-glow-2" />

      {/* Header */}
      <div className="hub-header fade-up">
        <div className="hub-badge">
          <Zap size={12} />
          <span>AI-Powered Platform</span>
        </div>
        <h1 className="hub-title">
          <span className="hub-title-biz">BiZ</span>
          <span className="hub-title-content">Content</span>
        </h1>
        <p className="hub-greeting">
          สวัสดี <strong>{firstName}</strong> — เลือกเครื่องมือที่ต้องการ
        </p>
      </div>

      {/* Feature Cards */}
      <div className="hub-cards fade-up" style={{ animationDelay: '0.15s' }}>
        {/* Card 1: Content from Image */}
        <button className="hub-card hub-card-content" onClick={() => router.push('/content')}>
          <div className="hub-card-glow hub-card-glow-cyan" />
          <div className="hub-card-inner">
            <div className="hub-card-top">
              <div className="hub-card-icon-wrap hub-icon-cyan">
                <ImageIcon size={28} strokeWidth={1.8} />
              </div>
              <div className="hub-card-arrow">
                <ArrowRight size={18} />
              </div>
            </div>
            <h2 className="hub-card-title">ทำคอนเทนต์จากภาพ</h2>
            <p className="hub-card-desc">
              อัปโหลดรูปภาพ แล้ว AI จะสร้างเนื้อหาพร้อมโพสต์ สำหรับทุกแพลตฟอร์ม
            </p>
            <div className="hub-card-tags">
              <span className="hub-tag">อัปโหลดรูป</span>
              <span className="hub-tag">สร้างแคปชั่น</span>
              <span className="hub-tag">คัดลอก & โพสต์</span>
            </div>
          </div>
        </button>

        {/* Card 2: AI Poster / Banner */}
        <button className="hub-card hub-card-poster" onClick={() => router.push('/poster')}>
          <div className="hub-card-glow hub-card-glow-purple" />
          <div className="hub-card-inner">
            <div className="hub-card-top">
              <div className="hub-card-icon-wrap hub-icon-purple">
                <Wand2 size={28} strokeWidth={1.8} />
              </div>
              <div className="hub-card-arrow">
                <ArrowRight size={18} />
              </div>
            </div>
            <h2 className="hub-card-title">สร้างภาพ / โปสเตอร์</h2>
            <p className="hub-card-desc">
              สร้างโปสเตอร์สวย ๆ อัตโนมัติ พร้อมดาวน์โหลด PNG, PDF, PPTX
            </p>
            <div className="hub-card-tags">
              <span className="hub-tag">ออกแบบ AI</span>
              <span className="hub-tag">หลายขนาด</span>
              <span className="hub-tag">ดาวน์โหลด</span>
            </div>
          </div>
        </button>
        {/* Card 3: Teacher Support Platform */}
        <button className="hub-card hub-card-poster" onClick={() => router.push('/teacher')} style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.12), rgba(37,99,235,0.12))' }}>
          <div className="hub-card-glow" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(13,148,136,0.3), transparent 70%)' }} />
          <div className="hub-card-inner">
            <div className="hub-card-top">
              <div className="hub-card-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.2), rgba(37,99,235,0.2))', color: '#0d9488' }}>
                <GraduationCap size={28} strokeWidth={1.8} />
              </div>
              <div className="hub-card-arrow">
                <ArrowRight size={18} />
              </div>
            </div>
            <h2 className="hub-card-title">Teacher Support Platform</h2>
            <p className="hub-card-desc">
              ระบบสนับสนุนการสอน 35 เครื่องมือ — Quiz, เช็คชื่อ, ตรวจงาน, จดหมายราชการ และอื่นๆ
            </p>
            <div className="hub-card-tags">
              <span className="hub-tag">Smart Quiz</span>
              <span className="hub-tag">AI ตรวจงาน</span>
              <span className="hub-tag">เช็คชื่อ GPS</span>
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="hub-footer fade-up" style={{ animationDelay: '0.3s' }}>
        <p>SPUBUS คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม</p>
      </div>
    </div>
  );
}
