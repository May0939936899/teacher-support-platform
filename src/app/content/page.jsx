'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ContentForm from '@/components/ContentForm';
import ContentPreview from '@/components/ContentPreview';
import ContentManagement from '@/components/ContentManagement';
import ContentTips from '@/components/ContentTips';
import MemoryBox from '@/components/MemoryBox';
import BtsHeroScene from '@/components/BtsHeroScene';
import toast from 'react-hot-toast';

export default function ContentPage() {
  const { user, loading, getAccessToken } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    platform: 'facebook',
    keyPoints: '',
    tone: 'professional',
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [poster, setPoster] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="spinner" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleResetForm = () => {
    setFormData({ title: '', category: '', platform: 'facebook', keyPoints: '', tone: 'professional' });
    setPoster(null);
    setPreview(null);
    setGeneratedContent('');
    toast.success('ล้างข้อมูลฟอร์มเรียบร้อยแล้ว');
  };

  const handleRegenerate = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error('กรุณาเลือกหัวข้อและหมวดหมู่ก่อนสร้างใหม่');
      return;
    }
    setIsGenerating(true);
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
      setGeneratedContent(data.content);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด: ' + (err.message || 'กรุณาลองใหม่'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadFromMemory = (slotData) => {
    if (slotData.content_text) setGeneratedContent(slotData.content_text);
    if (slotData.image_url) setPreview(slotData.image_url);
    if (slotData.platform || slotData.category) {
      setFormData(prev => ({
        ...prev,
        platform: slotData.platform || prev.platform,
        category: slotData.category || prev.category,
      }));
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <BtsHeroScene />

      <main className="main-wrapper">
        <div className="form-column">
          <ContentForm
            onContentGenerated={setGeneratedContent}
            preview={preview}
            setPreview={setPreview}
            poster={poster}
            setPoster={setPoster}
            formData={formData}
            setFormData={setFormData}
          />
        </div>

        <div className="preview-column">
          <ContentPreview
            generatedContent={generatedContent}
            setGeneratedContent={setGeneratedContent}
            preview={preview}
            formData={formData}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
            onReset={handleResetForm}
          />

          <ContentManagement
            formData={formData}
            generatedContent={generatedContent}
            onReset={handleResetForm}
          />

          <MemoryBox
            generatedContent={generatedContent}
            preview={preview}
            formData={formData}
            onLoad={handleLoadFromMemory}
          />

          <ContentTips />
        </div>
      </main>
    </div>
  );
}
