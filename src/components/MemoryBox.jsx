'use client';
import { useState, useEffect } from 'react';
import { Copy, Inbox, ArrowUpFromLine, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function MemoryBox({ generatedContent, preview, formData, onLoad }) {
  const { getAccessToken } = useAuth();
  const [savedContents, setSavedContents] = useState([null, null, null]);
  const [loading, setLoading] = useState(true);

  // Fetch saved contents on mount
  useEffect(() => {
    fetchSavedContents();
  }, []);

  async function fetchSavedContents() {
    try {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }

      const res = await fetch('/api/saved-contents', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSavedContents(data.slots);
    } catch (error) {
      console.error('Fetch saved contents error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToSlot(index) {
    if (!generatedContent && !preview) return;
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/saved-contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotIndex: index,
          contentText: generatedContent || null,
          imageUrl: preview || null,
          platform: formData.platform,
          category: formData.category,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      await fetchSavedContents();
      toast.success(`บันทึกคอนเทนต์ลงช่องที่ ${index + 1} เรียบร้อยแล้ว 📥`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  }

  async function handleClearSlot(index) {
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/saved-contents?slot=${index}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Delete failed');
      await fetchSavedContents();
      toast.success(`ลบข้อมูลช่องที่ ${index + 1} แล้ว 🗑️`);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  }

  function handleLoadFromSlot(index) {
    const slot = savedContents[index];
    if (!slot) return;
    if (onLoad) onLoad(slot);
    toast.success(`เรียกคืนคอนเทนต์จากช่องที่ ${index + 1} สำเร็จ 📤`);
  }

  return (
    <div className="memory-box-container">
      <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Copy size={12} /> กล่องฝากคอนเทนต์ (Memory Box)
      </h4>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
          <Loader2 size={20} className="spinner" style={{ color: 'var(--primary)' }} />
        </div>
      ) : null}
      <div className="memory-slots-wrapper" style={{ opacity: loading ? 0.4 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {savedContents.map((slotData, idx) => (
          <div key={idx} className={`memory-slot ${!slotData ? 'empty' : ''}`}>
            <div className="slot-header">
              <span className="slot-title">SLOT {idx + 1}</span>
            </div>
            {!slotData ? (
              <button
                type="button"
                className="slot-save-btn"
                onClick={() => handleSaveToSlot(idx)}
                disabled={!generatedContent && !preview}
                title={(!generatedContent && !preview) ? 'สร้างคอนเทนต์หรืออัปโหลดรูปก่อนบันทึก' : 'บันทึกคอนเทนต์ลงช่องนี้'}
              >
                <Inbox size={16} color="var(--primary)" /> เซฟเก็บไว้
              </button>
            ) : (
              <div className="slot-filled-content">
                {slotData.image_url && (
                  <div className="slot-image-preview">
                    <img src={slotData.image_url} alt={`Slot ${idx + 1} Image`} />
                  </div>
                )}
                <p className="slot-preview-text">
                  {slotData.content_text ? `${slotData.content_text.substring(0, 30)}...` : '(ไม่มีข้อความ)'}
                </p>
                <div className="slot-actions">
                  <button
                    type="button"
                    className="slot-action-btn load"
                    onClick={() => handleLoadFromSlot(idx)}
                    title="เรียกคืนข้อมูลนี้มาแก้ไข"
                  >
                    <ArrowUpFromLine size={14} /> เรียกคืน
                  </button>
                  <button
                    type="button"
                    className="slot-action-btn clear"
                    onClick={() => handleClearSlot(idx)}
                    title="ลบทิ้ง"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
