'use client';
import { useState } from 'react';
import { MessageSquare, RefreshCw, Copy, Check, Edit3, Sparkles, Loader2, ExternalLink, Monitor, Tablet, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { PLATFORMS, PLATFORM_POST_URLS } from '@/lib/constants';

const DEVICES = [
  {
    id: 'desktop',
    label: 'คอม',
    icon: Monitor,
    maxWidth: '100%',
    description: 'Desktop / PC',
  },
  {
    id: 'tablet',
    label: 'แท็บเลต',
    icon: Tablet,
    maxWidth: '540px',
    description: 'iPad / Tablet',
  },
  {
    id: 'mobile',
    label: 'มือถือ',
    icon: Smartphone,
    maxWidth: '375px',
    description: 'iPhone / Android',
  },
];

export default function ContentPreview({ generatedContent, setGeneratedContent, preview, formData, isGenerating, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editHovered, setEditHovered] = useState(false);
  const [deviceSize, setDeviceSize] = useState('desktop');

  const platform = PLATFORMS.find(p => p.id === formData.platform);
  const platformName = platform?.name || 'Facebook';
  const PlatformIcon = platform?.iconUrl
    ? <img src={platform.iconUrl} alt={platformName} className="brand-icon-img" />
    : <div className="brand-icon-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFDF00', color: '#000', fontWeight: 'bold', fontSize: '10px', borderRadius: '50%' }}>L8</div>;

  const charCount = generatedContent?.length || 0;

  const copyToClipboard = () => {
    if (!generatedContent?.trim()) return;
    navigator.clipboard.writeText(generatedContent).then(() => {
      setCopied(true);
      toast.success('คัดลอกข้อความสู่คลิปบอร์ดสำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const currentDevice = DEVICES.find(d => d.id === deviceSize);

  return (
    <div className="preview-card">
      <div className="preview-header">
        <div className="preview-title">
          <MessageSquare size={18} />
          <h3>({platformName} Preview)</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className="copy-btn regenerate-btn"
            onClick={onRegenerate}
            title="ให้ AI เขียนขึ้นมาใหม่อีกเวอร์ชัน (Regenerate)"
            disabled={isGenerating || !generatedContent}
          >
            <RefreshCw size={16} className={isGenerating ? 'spinner' : ''} />
            <span>{isGenerating ? 'กำลังสร้าง...' : 'สร้างใหม่'}</span>
          </button>
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={copyToClipboard}
            title="คัดลอกข้อความทั้งหมด"
            disabled={!generatedContent?.trim()}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
          {PLATFORM_POST_URLS[formData.platform] && (
            <a
              href={generatedContent?.trim() ? PLATFORM_POST_URLS[formData.platform] : undefined}
              target={generatedContent?.trim() ? '_blank' : undefined}
              rel="noopener noreferrer"
              className={`copy-btn post-link-btn ${formData.platform} ${!generatedContent?.trim() ? 'btn-disabled' : ''}`}
              title={generatedContent?.trim() ? `เปิด ${platformName} เพื่อโพสต์` : 'สร้าง Content ก่อนแล้วค่อยโพสต์'}
              onClick={(e) => { if (!generatedContent?.trim()) e.preventDefault(); }}
            >
              <ExternalLink size={16} />
              <span>โพสต์บน {platformName}</span>
            </a>
          )}
        </div>
      </div>

      {/* Device Size Picker */}
      <div className="device-picker">
        <span className="device-picker__label">ดูตัวอย่างบน:</span>
        <div className="device-picker__buttons">
          {DEVICES.map(device => {
            const Icon = device.icon;
            return (
              <button
                key={device.id}
                className={`device-picker__btn ${deviceSize === device.id ? 'device-picker__btn--active' : ''}`}
                onClick={() => setDeviceSize(device.id)}
                title={device.description}
              >
                <Icon size={15} />
                <span>{device.label}</span>
                {deviceSize === device.id && <span className="device-picker__badge">{device.description}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Device Frame + Preview */}
      <div className={`device-frame device-frame--${deviceSize}`}>
        {/* Top chrome bar for tablet/mobile */}
        {deviceSize === 'mobile' && (
          <div className="device-chrome device-chrome--mobile">
            <div className="device-notch" />
            <div className="device-status">
              <span>9:41</span>
              <div className="device-status__icons">
                <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="3" width="3" height="8" rx="0.5"/><rect x="4.5" y="2" width="3" height="9" rx="0.5"/><rect x="9" y="0.5" width="3" height="10.5" rx="0.5"/><rect x="13.5" y="0.5" width="2.5" height="10.5" rx="0.5" opacity="0.3"/></svg>
                <svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.5C15.5 4.5 18.6 6.1 20.7 8.6"/><path d="M3.3 8.6C5.4 6.1 8.5 4.5 12 4.5"/><path d="M7.2 12.3C8.6 10.9 10.2 10 12 10s3.4.9 4.8 2.3"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
                <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><path d="M23.5 4.5v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4"/></svg>
              </div>
            </div>
          </div>
        )}
        {deviceSize === 'tablet' && (
          <div className="device-chrome device-chrome--tablet">
            <div className="device-chrome__dot" />
            <span className="device-chrome__url">spubus.ac.th · social preview</span>
            <div className="device-chrome__dot device-chrome__dot--r" />
          </div>
        )}

        <div
          className="social-preview-wrapper"
          data-platform={formData.platform}
          style={{ maxWidth: currentDevice.maxWidth, margin: '0 auto', transition: 'max-width 0.35s cubic-bezier(0.16,1,0.3,1)' }}
        >
        <div className="social-header">
          <div className="social-avatar">SPU</div>
          <div className="social-meta">
            <strong>SPU Business School</strong>
            <span className="platform-indicator">{PlatformIcon} {platformName} Post • 🌍</span>
          </div>
        </div>

        <div className="social-content">
          {generatedContent ? (
            isEditing ? (
              <textarea
                className="edit-content-textarea"
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
              />
            ) : (
              <div
                className="text-content editable-text markdown-wrapper"
                onClick={() => setIsEditing(true)}
                onMouseEnter={() => setEditHovered(true)}
                onMouseLeave={() => setEditHovered(false)}
                title="คลิกเพื่อแก้ไขข้อความดิบ"
                style={{ position: 'relative' }}
              >
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
                <div className="edit-hint" style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: 'white', padding: '6px 12px', borderRadius: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex',
                  alignItems: 'center', gap: '6px', border: '1px solid #fee2e2',
                  color: '#ef4444', fontWeight: '600', fontSize: '13px',
                  opacity: editHovered ? 1 : 0, transition: 'opacity 0.2s ease',
                  cursor: 'pointer', pointerEvents: editHovered ? 'auto' : 'none'
                }}>
                  <Edit3 size={14} color="#ef4444" />
                  <span>แก้ไข</span>
                </div>
              </div>
            )
          ) : (
            <div className="empty-preview">
              {isGenerating ? (
                <div className="generating-state">
                  <Loader2 size={32} className="spinner text-primary" />
                  <p>Gemini AI กำลังพิมพ์แคปชั่นให้คุณ...</p>
                </div>
              ) : (
                <>
                  <Sparkles size={32} className="empty-icon-sparkle" />
                  <p>กรอกข้อมูลด้านซ้ายแล้วกดปุ่ม Generate<br />แคปชั่นแบบมืออาชีพจะแสดงที่นี่</p>
                </>
              )}
            </div>
          )}
        </div>

        {preview && (
          <div className="social-image">
            <img src={preview} alt="Post media" />
          </div>
        )}

        <div className="social-footer">
          <div className="metric"><span className="total-chars">{charCount}</span> ตัวอักษรทั้งหมด (รวม Tag)</div>
        </div>
        </div>

        {/* Bottom home bar for mobile */}
        {deviceSize === 'mobile' && (
          <div className="device-chrome device-chrome--bottom">
            <div className="device-home-bar" />
          </div>
        )}
      </div>

    </div>
  );
}
