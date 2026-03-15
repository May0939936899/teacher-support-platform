'use client';
import { Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

const PLATFORM_ACTION_MAP = {
  facebook: {
    label: 'ไปที่ Facebook เพื่อโพสต์',
    url: 'https://www.facebook.com/',
  },
  line: {
    label: 'ไปที่ LINE เพื่อล็อกอิน/โพสต์',
    url: 'https://access.line.me/',
  },
  instagram: {
    label: 'ไปที่ Instagram เพื่อโพสต์',
    url: 'https://www.instagram.com/',
  },
  tiktok: {
    label: 'ไปที่ TikTok Upload',
    url: 'https://www.tiktok.com/upload',
  },
  lemon8: {
    label: 'ไปที่ Lemon8',
    url: 'https://www.lemon8-app.com/',
  },
};

export default function ContentManagement({ formData, generatedContent, onReset }) {
  const platformId = formData.platform || 'facebook';
  const action = PLATFORM_ACTION_MAP[platformId] || PLATFORM_ACTION_MAP.facebook;

  return (
    <div className="content-management-card">
      <div className="management-header">
        <h4><Sparkles size={16} className="text-primary" /> จัดการ content</h4>
        <p className="management-desc">สร้างโพสต์เสร็จแล้ว? จัดการต่อได้ง่ายๆ ที่นี่</p>
      </div>
      
      <div className="management-actions">
        <button onClick={onReset} className="management-btn clear-btn" title="ล้างข้อมูลทั้งหมดเพื่อเริ่มใหม่">
          <RefreshCw size={14} /> เริ่มสร้างโพสต์ใหม่ (Clear)
        </button>

        {generatedContent && (
          <div className="platform-action-wrapper">
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="management-btn action-platform-btn"
            >
              <ExternalLink size={14} /> {action.label}
            </a>
            <p className="helper-text">กดเพื่อเปิดหน้าแพลตฟอร์มสำหรับล็อกอินหรือโพสต์คอนเทนต์ต่อได้ทันที</p>
          </div>
        )}
      </div>
    </div>
  );
}
