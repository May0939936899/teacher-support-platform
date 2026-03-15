'use client';
import { Sparkles } from 'lucide-react';

export default function ContentTips() {
  return (
    <div className="tips-card generator-tips">
      <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Sparkles size={14} style={{ color: 'var(--accent)' }} /> ไอเดียปั้นช่องสุดปังวันนี้!
      </h4>
      <ul style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', margin: 0 }}>
        <li><strong>✨ เวลาทองคำ:</strong> โพสต์ Facebook ช่วงเช้า 8.00-9.00 น. หรือช่วงพักกระเพาะตอน 12.00 น. คนเห็นเยอะสุด!</li>
        <li><strong>📸 กฎ 3 วินาทีของ IG/TikTok:</strong> ถ้าปกคลิปหรือรูปแรกไม่เตะตาใน 3 วินาที คนจะปัดทิ้งทันที</li>
        <li><strong>💬 ถามนำให้คนตอบ:</strong> ลองทิ้งท้ายด้วยคำถามง่ายๆ จะช่วยเพิ่มยอดคอมเมนต์!</li>
      </ul>
    </div>
  );
}
