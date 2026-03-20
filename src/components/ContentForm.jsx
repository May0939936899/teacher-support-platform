'use client';
import { useState } from 'react';
import { Upload, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, HEADLINES, PLATFORMS, TONES } from '@/lib/constants';

export default function ContentForm({ onContentGenerated, preview, setPreview, poster, setPoster, formData, setFormData }) {
  const { getAccessToken } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setPoster(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removePoster = () => {
    setPoster(null);
    setPreview(null);
  };

  const extractTextFromImage = async () => {
    if (!preview) {
      toast.error('กรุณาอัปโหลดรูปภาพก่อนทำการสกัดข้อความ');
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading('กำลังให้ AI อ่านรายละเอียดจากรูปภาพ...');

    try {
      const token = await getAccessToken();
      const mimeType = preview.split(';')[0].split(':')[1];
      const base64Data = preview.split(',')[1];

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed');

      setFormData({ ...formData, keyPoints: data.text });
      toast.success('AI อ่านข้อมูลสำเร็จ!', { id: toastId });
    } catch (error) {
      console.error('OCR Error:', error);
      let msg = error.message || 'กรุณาลองใหม่อีกครั้ง';
      if (msg.includes('429')) msg = 'โควต้าการใช้งาน API เต็มแล้ว กรุณาลองใหม่ในภายหลัง';
      toast.error('เกิดข้อผิดพลาดในการอ่านภาพ: ' + msg, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          platform: formData.platform,
          tone: formData.tone,
          keyPoints: formData.keyPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      onContentGenerated(data.content);
    } catch (err) {
      console.error('Generate Error:', err);
      toast.error('เกิดข้อผิดพลาดจาก AI: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
      setErrorMsg(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถเชื่อมต่อได้'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>สร้างคอนเทนต์ด้วย AI</h2>
        <p>ระบุเพื่อช่วยแต่งแคปชั่นให้ปังตามแพลตฟอร์มต่างๆ ทันที</p>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleGenerate} className="content-form">
        {/* Headline */}
        <div className="form-group">
          <label htmlFor="title">หัวข้อโพสต์ (Headline)</label>
          <div className="select-wrapper">
            <select
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={formData.title ? 'has-value' : ''}
            >
              <option value="" disabled hidden>เลือกเป้าหมายของคอนเทนต์...</option>
              {HEADLINES.map((headline, idx) => (
                <option key={idx} value={headline}>{headline}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="category">หมวดหมู่ / สาขา</label>
          <div className="select-wrapper">
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={formData.category ? 'has-value' : ''}
            >
              <option value="" disabled hidden>เลือกหมวดหมู่ / สาขา...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform */}
        <div className="form-group">
          <label>แพลตฟอร์มปลายทาง</label>
          <div className="platform-selector">
            {PLATFORMS.map(platform => (
              <label
                key={platform.id}
                className={`platform-btn ${platform.id} ${formData.platform === platform.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="platform"
                  value={platform.id}
                  checked={formData.platform === platform.id}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="hidden-radio"
                />
                {platform.id === 'lemon8' ? (
                  <span className="lemon8-icon">L8</span>
                ) : platform.iconUrl ? (
                  <img src={platform.iconUrl} alt={platform.name} className="brand-icon-img" />
                ) : null}
                <span className="platform-label">{platform.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="form-group">
          <label>โทนการเขียน (Tone & Style)</label>
          <div className="tone-grid">
            {TONES.map(tone => (
              <label key={tone.id} className={`tone-btn ${formData.tone === tone.id ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="tone"
                  value={tone.id}
                  checked={formData.tone === tone.id}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  className="hidden-radio"
                />
                <span className="tone-icon">{tone.icon}</span>
                <span className="tone-name">{tone.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload + AI Read Side-by-Side */}
        <div className="form-group">
          <label>อัปโหลดรูปภาพ / โปสเตอร์ (Media)</label>
          <div className={`upload-ai-row ${preview ? 'has-preview' : ''}`}>
            {/* Left: Upload area */}
            <div className="upload-ai-left">
              <div
                className={`upload-area ${preview ? 'has-image' : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('poster-upload').click()}
              >
                {preview ? (
                  <div className="preview-container">
                    <img src={preview} alt="Poster preview" className="poster-preview" />
                    <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); removePoster(); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrapper">
                      <Upload size={32} />
                    </div>
                    <p className="upload-text">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                    <p className="upload-subtext">เพื่อดู Preview (ไม่ส่งผลต่อข้อความของ AI)</p>
                  </div>
                )}
                <input
                  type="file"
                  id="poster-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-input"
                />
              </div>
            </div>

            {/* Right: AI Read box — only visible when image is uploaded */}
            {preview && (
              <div className="upload-ai-right">
                <div className="ai-read-box">
                  <div className="ai-read-header">
                    <Sparkles size={18} className="ai-read-icon" />
                    <span>AI ช่วยอ่านจากรูปภาพ</span>
                  </div>
                  <p className="ai-read-desc">
                    ให้ AI วิเคราะห์รูปภาพและดึงข้อความสำคัญออกมาให้อัตโนมัติ
                  </p>
                  <button
                    type="button"
                    onClick={extractTextFromImage}
                    disabled={isExtracting}
                    className="ai-read-btn"
                  >
                    {isExtracting ? (
                      <><Loader2 size={16} className="spinner" /> กำลังวิเคราะห์...</>
                    ) : (
                      <><Sparkles size={16} /> เริ่มอ่านด้วย AI</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Points — AI result shows here */}
        <div className="form-group">
          <label htmlFor="keyPoints">ประเด็นสำคัญ (Optional)</label>
          {formData.keyPoints && (
            <div className="ai-read-result" style={{ marginBottom: '8px' }}>
              <span className="ai-read-result-badge">ผลลัพธ์จาก AI</span>
            </div>
          )}
          <textarea
            id="keyPoints"
            placeholder="พิมพ์ไฮไลท์สั้นๆ หรืออัปโหลดรูปภาพแล้วกดปุ่ม 'AI ช่วยอ่านจากรูปภาพ'..."
            rows={formData.keyPoints ? 6 : 3}
            value={formData.keyPoints}
            onChange={(e) => setFormData({ ...formData, keyPoints: e.target.value })}
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="submit" className="submit-btn generate-btn" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 size={20} className="spinner" />
                <span>Gemini กำลังคิดและเขียนเนื้อหา...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>สร้างแคปชั่น (Generate AI Content)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
