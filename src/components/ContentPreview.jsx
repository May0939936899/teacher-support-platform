'use client';
import { useState } from 'react';
import { MessageSquare, RefreshCw, Copy, Check, Edit3, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { PLATFORMS, PLATFORM_POST_URLS } from '@/lib/constants';

export default function ContentPreview({ generatedContent, setGeneratedContent, preview, formData, isGenerating, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editHovered, setEditHovered] = useState(false);

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

  return (
    <div className="preview-card">
      <div className="preview-header">
        <div className="preview-title">
          <MessageSquare size={18} />
          <h3>({platformName} Preview)</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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

      <div className="social-preview-wrapper" data-platform={formData.platform}>
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

    </div>
  );
}
