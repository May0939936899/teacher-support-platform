import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Upload, X, Loader2, CheckCircle, Copy, Check, MessageSquare, ExternalLink, RefreshCw, Info, Sparkles, Edit3, Image as ImageIcon, BarChart3, Lock, Users, Target, Inbox, ArrowUpFromLine } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
const CATEGORY_TAGS = {
  "คณะบริหารธุรกิจ (ภาพรวม)": "#YouDreamItYouOwnIt\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#เรียนกับตัวจริงประสบการณ์จริง\n#SBS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาการบริหารและการจัดการสมัยใหม่": "#YouDreamItYouOwnIt\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาการบริหารและการจัดการสมัยใหม่\n#เรียนกับตัวจริงประสบการณ์จริง\n#SBS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาการตลาดดิจิทัล": "#YouDreamItYouOwnIt\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาการตลาดดิจิทัล\n#เรียนกับตัวจริงประสบการณ์จริง\n#SBS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาธุรกิจระหว่างประเทศ": "#YouDreamItYouOwnIt\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาธุรกิจระหว่างประเทศ\n#เรียนกับตัวจริงประสบการณ์จริง\n#SBS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "สาขาบริการธุรกิจ": "#YouDreamItYouOwnIt\n#คณะบริหารธุรกิจ #มหาวิทยาลัยศรีปทุม\n#สาขาวิชาบริการธุรกิจ\n#เรียนกับตัวจริงประสบการณ์จริง\n#SBS #SPU #SripatumUniversity\n#SripatumBusinessSchool",
  "ศูนย์บ่มเพาะธุรกิจ": "#BusinessIncubator\n#ศูนย์บ่มเพาะธุรกิจ #คณะบริหารธุรกิจ\n#มหาวิทยาลัยศรีปทุม #SBS #SPU",
  "กิจการนักศึกษา": "#StudentAffairs\n#กิจการนักศึกษา #คณะบริหารธุรกิจ\n#มหาวิทยาลัยศรีปทุม #SBS #SPU"
};

const CATEGORIES = Object.keys(CATEGORY_TAGS);

const HEADLINES = [
  "โปรโมทหลักสูตรและเปิดรับสมัครนักศึกษาใหม่",
  "แนะนำจุดเด่นและบรรยากาศการเรียนการสอนของคณะ",
  "แชร์ความสำเร็จและประสบการณ์ของศิษย์เก่า/นักศึกษาปัจจุบัน",
  "ประชาสัมพันธ์กิจกรรม โครงการ หรือเวิร์กชอปของคณะ",
  "ให้ความรู้ ทริคทางธุรกิจ หรือเทรนด์ใหม่ๆ ที่น่าสนใจ",
  "เชิญชวนร่วมงาน Open House และแนะแนวการศึกษา",
  "ประกาศข่าวสารและความร่วมมือกับองค์กรธุรกิจชั้นนำ",
];

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="FB" className="brand-icon-img" />
  },
  {
    id: 'line',
    name: 'LINE',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" className="brand-icon-img" />
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="IG" className="brand-icon-img" />
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <img src="https://cdn.iconscout.com/icon/free/png-256/tiktok-2270636-1891163.png" alt="TikTok" className="brand-icon-img" />
  },
  {
    id: 'lemon8',
    name: 'Lemon8',
    icon: <div className="brand-icon-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFDF00', color: '#000', fontWeight: 'bold', fontSize: '10px', borderRadius: '50%' }}>L8</div>
  },
];

const TONES = [
  { id: 'professional', name: 'ทางการ น่าเชื่อถือ', icon: '💼' },
  { id: 'fun', name: 'สนุกสนาน เป็นกันเอง', icon: '🎉' },
  { id: 'concise', name: 'สั้น กระชับ ตรงประเด็น', icon: '⚡' },
  { id: 'emoji', name: 'เน้นอิโมจิ สีสันสะดุดตา', icon: '🎨' }
];

function App() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    platform: 'facebook',
    keyPoints: '',
    tone: 'professional'
  });

  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showApiSettings, setShowApiSettings] = useState(!import.meta.env.VITE_GEMINI_API_KEY);

  const [generatedContent, setGeneratedContent] = useState('');
  const [poster, setPoster] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Memory Box State (3 slots)
  const [savedContents, setSavedContents] = useState([null, null, null]);

  // Admin Dashboard States
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [usageStats, setUsageStats] = useState([]);

  // Load stats specifically when Admin dashboard is opened
  useEffect(() => {
    if (isAdmin) {
      const stats = JSON.parse(localStorage.getItem('biz_content_usage_stats') || '[]');
      setUsageStats(stats);
    }
  }, [isAdmin]);

  const handleResetForm = () => {
    setFormData({
      title: '',
      category: '',
      platform: 'facebook',
      keyPoints: '',
      tone: 'professional'
    });
    setPoster(null);
    setPreview(null);
    setGeneratedContent('');
    toast.success('ล้างข้อมูลฟอร์มเรียบร้อยแล้ว');
  };

  const handleSaveToSlot = (index) => {
    if (!generatedContent && !preview) return; // Allow saving if there's either text or an image
    const newSaved = [...savedContents];
    newSaved[index] = {
      text: generatedContent,
      image: preview,
      posterFile: poster // Need to save the actual file object too to load it back fully
    };
    setSavedContents(newSaved);
    toast.success(`บันทึกคอนเทนต์ลงช่องที่ ${index + 1} เรียบร้อยแล้ว 📥`);
  };

  const handleLoadFromSlot = (index) => {
    if (!savedContents[index]) return;
    setGeneratedContent(savedContents[index].text);
    setPreview(savedContents[index].image);
    setPoster(savedContents[index].posterFile);
    toast.success(`เรียกคืนคอนเทนต์จากช่องที่ ${index + 1} สำเร็จ 📤`);
  };

  const handleClearSlot = (index) => {
    const newSaved = [...savedContents];
    newSaved[index] = null;
    setSavedContents(newSaved);
    toast.success(`ลบข้อมูลช่องที่ ${index + 1} แล้ว 🗑️`);
  };

  const finalContentText = generatedContent;

  const wordCount = finalContentText ? finalContentText.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  const charCount = finalContentText.length;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
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

    if (!apiKey) {
      toast.error('กรุณาระบุ Gemini API Key ก่อนเริ่มทำการสแกนภาพ');
      setShowApiSettings(true);
      return;
    }

    setIsExtracting(true);
    const toastId = toast.loading('กำลังให้ AI อ่านรายละเอียดจากรูปภาพ...(Gemini)');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Extract mime type dynamically from Data URL
      const mimeType = preview.split(';')[0].split(':')[1];
      const base64Data = preview.split(',')[1];

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const prompt = "วิเคราะห์โปสเตอร์นี้แล้วสรุปข้อมูลสำคัญออกมาเป็นหัวข้อสั้นๆ กระชับที่สุด ได้แก่: ชื่องาน, ไฮไลท์ความน่าสนใจ (1 ประโยค), ชื่อวิทยากร, วันที่, เวลา, และสถานที่ หากข้อมูลไหนไม่มีในภาพไม่ต้องแต่งเพิ่มหรือเดาขึ้นมาเอง ให้ข้ามไปเลย";

      const result = await model.generateContent([
        prompt,
        imagePart
      ]);
      const response = await result.response;
      let text = response.text();

      if (!text || text.trim() === '') {
        throw new Error("AI ไม่สามารถสกัดข้อความจากภาพนี้ได้ กรุณาลองใช้ภาพที่ชัดเจนขึ้น");
      }

      setFormData({ ...formData, keyPoints: text });
      toast.success('AI อ่านข้อมูลสำเร็จ!', { id: toastId });
    } catch (error) {
      console.error("OCR Error:", error);
      let errorMessage = error.message || 'กรุณาลองใหม่อีกครั้ง';
      if (error.status === 429 || errorMessage.includes('429')) {
        errorMessage = 'โควต้าการใช้งาน API ฟรีเต็มแล้ว (429 Too Many Requests) กรุณาลองใหม่ในภายหลัง หรือเปลี่ยน API Key ค่ะ';
      }
      toast.error('เกิดข้อผิดพลาดในการอ่านภาพ: ' + errorMessage, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const copyToClipboard = () => {
    if (!finalContentText.trim()) return;
    navigator.clipboard.writeText(finalContentText).then(() => {
      setCopied(true);
      toast.success('คัดลอกข้อความสู่คลิปบอร์ดสำเร็จ');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getPlatformPrompt = (platform) => {
    switch (platform) {
      case 'facebook': return 'เขียนความยาวปานกลาง เนื้อหาครบถ้วน มีการเว้นบรรทัดให้อ่านง่าย ใช้ Emoji เล็กน้อยให้ดูน่าสนใจ สร้างความน่าเชื่อถือแบบมืออาชีพแต่เข้าถึงง่าย';
      case 'line': return 'เขียนสั้น กระชับ สรุปใจความสำคัญเป็นข้อๆ (Bullet points) ใช้ Emoji ที่ทำให้ดูเป็นกันเอง เหมาะสมกับการบรอดแคสต์ให้ผู้ติดตามอ่านผ่านมือถือ';
      case 'instagram': return 'เน้นไลฟ์สไตล์ สั้นกระชับ ดึงดูดสายตาตั้งแต่ประโยคแรก การเรียงบรรทัดสวยงาม ใช้ Emoji นำสายตา ไม่ต้องใส่ลิงก์ยาวๆ (แนะนำให้บอกว่าลิงก์ที่ Bio)';
      case 'tiktok': return 'เขียนสั้นโคตรๆ เอาแค่ฮุค (Hook) กระชากใจใน 3 วินาทีแรก เป็นสคริปต์สั้นๆ หรือแคปชั่นยั่วกิเลสให้กระตุ้นการดูคลิปวิดีโอต่อ';
      case 'lemon8': return 'สไตล์วัยรุ่นนักรีวิว เขียนให้ดูสดใส น่ารัก มีหัวข้อชัดเจน ให้ฮาวทูหรือเคล็ดลับ (Tips) มีความเป็นเพื่อนบอกต่อสิ่งดีๆ';
      default: return 'เขียนให้น่าสนใจและดึงดูดใจ';
    }
  };

  const getTonePrompt = (tone) => {
    switch (tone) {
      case 'professional': return 'เขียนแบบ "มืออาชีพ น่าเชื่อถือ แต่ทันสมัย" **เน้นความสั้น กระชับ ฉับไว ไม่พรรณนายืดเยื้อเด็ดขาด** ใช้ Emoji เท่าที่จำเป็นเพื่อให้อ่านง่ายขึ้น แต่ไม่ต้องเยอะจนรก ห้ามใช้คำฟุ่มเฟือย';
      case 'fun': return 'เขียนแบบ "วัยรุ่น เป็นกันเอง สนุกสนาน คึกคัก" เหมือนเพื่อนชวนเพื่อน **ต้องสั้น กระชับ อ่านปรู๊ดเดียวจบ** จัดเต็มความครีเอทีฟและใส่ Emoji สนุกๆ ให้ดูมีสีสัน';
      case 'concise': return 'เขียนแบบ "สรุปใจความสำคัญแบบ Executive Summary" สั้นที่สุดเท่าที่จะทำได้ เข้าประเด็นทันทีในประโยคแรก ไม่ต้องมีน้ำ ห้ามเกริ่นนำเด็ดขาด';
      case 'emoji': return 'เขียนแบบสั้นๆ กระชับ แต่ "จัดเต็ม Emoji" ทุกบรรทัดหรือทุกประโยคต้องมี Emoji น่ารักๆ ประกอบเพื่อดึงดูดสายตาสายคอนเทนต์';
      default: return 'เขียนแบบสั้น กระชับ เข้าใจง่าย และดูเป็นมืออาชีพ';
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!apiKey) {
      setErrorMsg('กรุณาระบุ Gemini API Key ก่อนสร้างคอนเทนต์');
      setShowApiSettings(true);
      return;
    }

    setIsGenerating(true);
    setIsEditing(false);
    setErrorMsg('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
คุณคือ "นักเขียนคอนเทนต์องค์กรระดับท็อป" (Top-tier Professional Copywriter) ที่เชี่ยวชาญการเขียนด้วยภาษา "ทันสมัย มืออาชีพ หรูหราแต่เข้าถึงได้"

กรุณาเขียนแคปชั่นโปรโมทของ คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม โดยอิงจากข้อมูลดังนี้:
- หัวข้อหลัก (Title): "${formData.title}"
- สาขาวิชา: "${formData.category}"
- ประเด็นสำคัญ / ข้อมูลดิบ: "${formData.keyPoints || 'กล่าวถึงจุดเด่นทั่วไป'}"
- นำไปโพสต์บนแพลตฟอร์ม: "${formData.platform}"

**คำสั่งเฉพาะสำหรับแพลตฟอร์ม ${formData.platform}**:
${getPlatformPrompt(formData.platform)}

**โทนการเขียน (Tone & Style)**: 
${getTonePrompt(formData.tone)}

**ข้อกำหนดสำคัญ (Rules)**:
- ❌ **ห้ามใช้เครื่องหมายดอกจัน (*) หรือ Markdown Bolding (**) เด็ดขาด ไม่ว่าจะเน้นคำหรือทำ Bullet Point ก็ห้ามใช้**
- 🚨 **สำคัญที่สุด: คุณต้องเริ่มต้นประโยคแรกสุดของทุกโพสต์ด้วยคำว่า "คณะบริหารธุรกิจ ม.ศรีปทุม" เสมอ ไม่ว่าจะเป็นโพสต์แบบไหนก็ตาม**
- ห้ามพูดเกริ่นนำแบบ AI (เช่น "ได้เลยครับ นี่คือคอนเทนต์...") ห้ามทิ้งท้ายแบบหุ่นยนต์
- **การจัดวาง (Layout) สำคัญมาก!:** 
  - ต้องอ่านง่ายเป็นที่สุด! ห้ามเขียนติดกันเป็นพรืดเด็ดขาด เน้นขมวดปมให้สั้น
  - ใช้ Bullet Point (แบบใช้อิโมจิน่ารักๆ แทนจุดวงกลม) เพื่อย่อยข้อมูลที่ยาวๆ ให้เป็นข้อย่อยๆ อ่านปรู๊ดเดียวเข้าใจ
  - สำหรับข้อมูลสำคัญอย่าง "วิทยากร", "วันที่", "เวลา", และ "สถานที่" **บังคับให้ต้องเคาะขึ้นบรรทัดใหม่บรรทัดละ 1 เรื่องเสมอ** 
  - ตัวอย่างที่ถูกต้อง:
    👤 วิทยากร: ...
    📅 วันที่: ...
    ⏰ เวลา: ...
    📍 สถานที่: ...
- **การใช้อิโมจิ (Emoji):** ใส่ให้ดูเป็นมืออาชีพแต่เข้าถึงง่าย ช่วยย่อยข้อมูลให้สายตาโฟกัสถูกจุด "วาง Emoji ไว้ด้านหน้าสุด" ของข้อความหรือบรรทัดนั้นๆ เสมอ ห้ามวาง Emoji ไว้ท้ายประโยคเด็ดขาด
- ใช้ภาษาที่ดู Active แปลกใหม่ และดูเหนือชั้นกว่าคนทั่วไป
- เพิ่ม Hashtag ยืนพื้นท้ายโพสต์เสมอ (ใช้ชุดนี้ห้ามเปลี่ยน และนำไปวางบรรทัดล่างสุดเท่านั้น): 
${CATEGORY_TAGS[formData.category] || CATEGORY_TAGS["คณะบริหารธุรกิจ (ภาพรวม)"]}

**การนำเสนอเนื้อหา (Content Structure)**
ไม่ต้องทำตามฟอร์แมตเป๊ะๆ แต่ให้นำเสนอข้อมูลต่อไปนี้อย่างน่าสนใจและเป็นธรรมชาติ:
- ชื่องาน/หัวข้อหลัก: ${formData.title}
- สาขาที่เกี่ยวข้อง: ${formData.category && formData.category !== "คณะบริหารธุรกิจ (ภาพรวม)" ? formData.category : 'รวมทุกสาขาวิชา'}
- ข้อมูล/ประเด็นจากภาพ: ${formData.keyPoints || 'กล่าวถึงจุดเด่นทั่วไป'}
- ใส่ Call to Action ชัดเจนในตอนท้าย (เช่น เชิญชวนให้มางาน, ทักแชทสอบถาม, หรือสมัครเรียน)
`;

      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      setGeneratedContent(outputText);

      // --- Backend Usage Tracking Mock (LocalStorage) ---
      // We store metadata only to protect user privacy (No raw text saved)
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        platform: formData.platform,
        category: formData.category || 'รวมทุกสาขาวิชา',
        tone: formData.tone
      };
      const existingStats = JSON.parse(localStorage.getItem('biz_content_usage_stats') || '[]');
      localStorage.setItem('biz_content_usage_stats', JSON.stringify([newRecord, ...existingStats]));
      // ---------------------------------------------------

    } catch (err) {
      console.error("Gemini API Error:", err);
      toast.error('เกิดข้อผิดพลาดจาก AI: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
      setErrorMsg(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถเชื่อมต่อ Gemini API ได้'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const PlatformIcon = PLATFORMS.find(p => p.id === formData.platform)?.icon || null;
  const platformName = PLATFORMS.find(p => p.id === formData.platform)?.name || 'Facebook';

  return (
    <div className="app-container">
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#333', color: '#fff', fontSize: '14px', borderRadius: '10px' } }} />
      <nav className="top-navigation">
        <div className="top-nav-container">
          <div className="header-top-logos">
            <img src="/spu-bus-logo.png" alt="SPU Business School" className="logo-img spu-logo" />
            <img src="/ai-club-logo.png" alt="AI Business Talent Club" className="logo-img ai-logo" />
          </div>
          <div className="nav-brand">
            <Sparkles size={18} className="brand-icon" />
            <span>คณะบริหารธุรกิจ</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <button
              className="admin-header-btn"
              onClick={() => setShowAdminLogin(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
            >
              <Lock size={14} /> Admin
            </button>
          </div>
        </div>
      </nav>

      <header className="hero-header">
        <div className="hero-content">
          <h1>
            <span className="text-gradient">BiZ Content</span>
          </h1>
          <p className="subtitle">AI-Powered Content Generator for SPU Business School</p>
        </div>
      </header>

      <main className="main-wrapper">
        <div className="form-column">
          <div className="form-card">
            <div className="form-header">
              <h2>สร้างคอนเทนต์ด้วย AI</h2>
              <p>ระบุเพื่อช่วยแต่งแคปชั่นให้ปังตามแพลตฟอร์มต่างๆ ทันที</p>
            </div>

            {showApiSettings && (
              <div className="api-settings-card">
                <label htmlFor="apiKey" className="api-label">
                  <Sparkles size={14} /> Gemini API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  placeholder="Paste your Gemini API Key here"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="api-input"
                />
                <p className="api-help">ระบบต้องการเชื่อมต่อผ่าน API Key จาก Google AI Studio เพื่อใช้งานโมเดล Gemini 2.5 Flash ในการอ่านภาพและเขียนเนื้อหา (กำลังใช้ API Key ล่าสุดปัจจุบัน)</p>
              </div>
            )}

            {errorMsg && (
              <div className="error-banner">
                <Info size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleGenerate} className="content-form">
              <div className="form-group">
                <label htmlFor="title">หัวข้อโพสต์ (Headline)</label>
                <div className="select-wrapper">
                  <select
                    id="title"
                    name="title"
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

              <div className="form-group">
                <label htmlFor="category">Host Content</label>
                <div className="select-wrapper">
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={formData.category ? 'has-value' : ''}
                  >
                    <option value="" disabled hidden>เลือก Host Content</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>แพลตฟอร์มปลายทาง</label>
                <div className="platform-selector">
                  {PLATFORMS.map(platform => (
                    <label key={platform.id} className={`platform-btn ${formData.platform === platform.id ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="platform"
                        value={platform.id}
                        checked={formData.platform === platform.id}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="hidden-radio"
                      />
                      {platform.icon}
                      <span>{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>

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

              <div className="form-group">
                <label>อัปโหลดรูปภาพ / โปสเตอร์ (Media)</label>
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

              <div className="form-group">
                <div className="label-with-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label htmlFor="keyPoints" style={{ marginBottom: 0 }}>ประเด็นสำคัญ (Optional)</label>
                  {preview && (
                    <button
                      type="button"
                      onClick={extractTextFromImage}
                      disabled={isExtracting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 8px', fontSize: '0.8rem',
                        backgroundColor: '#f0f3ff', color: '#3b82f6',
                        border: '1px solid #bfdbfe', borderRadius: '4px',
                        cursor: isExtracting ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {isExtracting ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
                      {isExtracting ? 'กำลังวิเคราะห์...' : 'AI ช่วยอ่านจากรูปภาพ'}
                    </button>
                  )}
                </div>
                <textarea
                  id="keyPoints"
                  name="keyPoints"
                  placeholder="พิมพ์ไฮไลท์สั้นๆ หรืออัปโหลดรูปภาพแล้วกดปุ่ม 'AI ช่วยอ่านจากรูปภาพ'..."
                  rows={3}
                  value={formData.keyPoints}
                  onChange={(e) => setFormData({ ...formData, keyPoints: e.target.value })}
                  style={{ minHeight: '80px' }}
                ></textarea>
              </div>

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
        </div>

        {/* Live Preview Column */}
        <div className="preview-column">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-title">
                <MessageSquare size={18} />
                <h3>({platformName} Preview)</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="copy-btn"
                  onClick={(e) => {
                    if (!formData.title || !formData.category) {
                      toast.error('กรุณาเลือกหัวข้อและ Host Content ก่อน');
                      return;
                    }
                    handleGenerate(e);
                  }}
                  title="ให้ AI เขียนขึ้นมาใหม่อีกเวอร์ชัน (Regenerate)"
                  disabled={isGenerating || !finalContentText}
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                >
                  <RefreshCw size={16} className={isGenerating ? "spinner" : ""} />
                  <span>{isGenerating ? 'กำลังสร้าง...' : 'สร้างใหม่ (Regenerate)'}</span>
                </button>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={copyToClipboard}
                  title="คัดลอกข้อความทั้งหมดบรรทัด"
                  disabled={!finalContentText.trim()}
                  style={{
                    backgroundColor: copied ? '#e0f2fe' : '#f1f5f9',
                    color: copied ? '#0284c7' : '#94a3b8',
                    borderColor: copied ? '#bae6fd' : '#e2e8f0'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
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
                {finalContentText ? (
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
                      title="คลิกเพื่อแก้ไขข้อความดิบ"
                      style={{ position: 'relative' }}
                    >
                      <ReactMarkdown>{finalContentText}</ReactMarkdown>
                      <div className="edit-hint" style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid #fee2e2',
                        color: '#ef4444',
                        fontWeight: '600',
                        fontSize: '13px',
                        opacity: 1, // override CSS to always show
                        cursor: 'pointer'
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
                <div className="metric"><span className="total-chars">{charCount}</span> ตัวอักษร &nbsp;|&nbsp; <span className="total-chars">{wordCount}</span> คำ</div>
              </div>
            </div>

            <div className="quick-actions-widget">
              <div className="admin-trigger-zone" onClick={() => setShowAdminLogin(true)} title="Hidden Admin Dashboard"></div>
              <h4><Sparkles size={16} style={{ color: "var(--primary)" }} /> จัดการ content</h4>
              <p className="widget-desc">สร้างโพสต์เสร็จแล้ว? กดปุ่มด้านล่างเพื่อล้างข้อมูลและเริ่มงานใหม่ได้ทันที</p>

              <div className="widget-actions">
                <button
                  onClick={handleResetForm}
                  className="widget-btn reset-btn"
                >
                  <RefreshCw size={14} /> เริ่มสร้างโพสต์ใหม่ (Clear)
                </button>
                {finalContentText && (
                  <a
                    href={
                      formData.platform === 'facebook' ? 'https://www.facebook.com/' :
                        formData.platform === 'line' ? 'https://timeline.line.me/' :
                          formData.platform === 'instagram' ? 'https://www.instagram.com/' :
                            formData.platform === 'tiktok' ? 'https://www.tiktok.com/upload' :
                              formData.platform === 'lemon8' ? 'https://www.lemon8-app.com/' : '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="widget-btn"
                    style={{ backgroundColor: '#1d4ed8', color: 'white', textDecoration: 'none', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ExternalLink size={14} /> โพสต์ลง {platformName}
                  </a>
                )}
              </div>

              {/* Memory Box UI */}
              <div className="memory-box-container">
                <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Copy size={12} /> กล่องฝากคอนเทนต์ (Memory Box)
                </h4>
                <div className="memory-slots-wrapper">
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
                          disabled={!finalContentText && !preview}
                          title={(!finalContentText && !preview) ? "สร้างคอนเทนต์หรืออัปโหลดรูปก่อนบันทึก" : "บันทึกคอนเทนต์และรูปภาพลงช่องนี้"}
                        >
                          <Inbox size={16} color="#4F46E5" /> เซฟเก็บไว้
                        </button>
                      ) : (
                        <div className="slot-filled-content">
                          {slotData.image && (
                            <div className="slot-image-preview">
                              <img src={slotData.image} alt={`Slot ${idx + 1} Image`} />
                            </div>
                          )}
                          <p className="slot-preview-text">
                            {slotData.text ? `${slotData.text.substring(0, 30)}...` : '(ไม่มีข้อความ)'}
                          </p>
                          <div className="slot-actions">
                            <button
                              type="button"
                              className="slot-action-btn load"
                              onClick={() => handleLoadFromSlot(idx)}
                              title="เรียกคืนข้อมูลและรูปภาพ"
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

              <div className="tips-card generator-tips" style={{ marginTop: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#f59e0b" /> ไอเดียปั้นช่องสุดปังวันนี้!
                </h4>
                <ul style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', margin: 0 }}>
                  <li><strong>✨ เวลาทองคำ:</strong> โพสต์ Facebook ช่วงเช้า 8.00-9.00 น. หรือช่วงพักกระเพาะตอน 12.00 น. คนเห็นเยอะสุด!</li>
                  <li><strong>📸 กฎ 3 วินาทีของ IG/TikTok:</strong> ถ้าปกคลิปหรือรูปแรกไม่เตะตาใน 3 วินาที คนจะปัดทิ้งทันที อย่าลืมใส่ตัวหนังสือล่อเป้าตัวใหญ่ๆ ด้วยนะ</li>
                  <li><strong>💬 ถามนำให้คนตอบ:</strong> สุดท้ายของแคปชั่น ลองทิ้งท้ายด้วยคำถามง่ายๆ เช่น "เพื่อนๆ ชอบแบบไหนกันบ้าง?" จะช่วยเพิ่มยอดคอมเมนต์กระจุย!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Dashboard Login Modal */}
      {showAdminLogin && !isAdmin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3><Lock size={20} /> ผู้ดูแลระบบ (Admin)</h3>
              <button onClick={() => setShowAdminLogin(false)} className="close-btn"><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <p>กรุณาใส่รหัสผ่านเพื่อเข้าสู่หลังบ้าน (Dashboard)</p>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="รหัสผ่านผู้ดูแลระบบ"
                className="api-input"
                autoFocus
              />
              <button
                className="save-api-btn"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  if (adminPassword === 'Admin1234') {
                    setIsAdmin(true);
                    toast.success('เข้าสู่ระบบ Admin สำเร็จ');
                  } else {
                    toast.error('รหัสผ่านไม่ถูกต้อง');
                  }
                }}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Interface */}
      {isAdmin && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => { setIsAdmin(false); setShowAdminLogin(false); setAdminPassword(''); }}>
          <div className="admin-dashboard-panel" onClick={e => e.stopPropagation()}>
            <div className="dashboard-header">
              <h2><BarChart3 size={24} /> Biz Content | Backend Dashboard</h2>
              <button onClick={() => { setIsAdmin(false); setShowAdminLogin(false); setAdminPassword(''); }} className="close-btn"><X size={24} /></button>
            </div>

            <div className="dashboard-metrics">
              <div className="metric-card">
                <div className="metric-icon"><Users size={24} /></div>
                <div className="metric-info">
                  <span className="metric-label">จำนวนการใช้งานทั้งหมด</span>
                  <span className="metric-value">{usageStats.length}</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon"><Target size={24} /></div>
                <div className="metric-info">
                  <span className="metric-label">แพลตฟอร์มยอดฮิต</span>
                  <span className="metric-value">
                    {usageStats.length > 0 ?
                      Object.entries(usageStats.reduce((acc, curr) => { acc[curr.platform] = (acc[curr.platform] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0][0]
                      : '-'}
                  </span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon"><Sparkles size={24} /></div>
                <div className="metric-info">
                  <span className="metric-label">หมวดหมู่ยอดฮิต</span>
                  <span className="metric-value" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                    {usageStats.length > 0 ?
                      Object.entries(usageStats.reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0][0]
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="dashboard-table-container">
              <h3>บันทึกการใช้งานล่าสุด (Recent Logs)</h3>
              <p className="table-subtitle">*ระบบไม่ได้จัดเก็บลายนิ้วมือหรือข้อความดิบเพื่อรักษา Privacy ของผู้ใช้</p>
              {usageStats.length === 0 ? (
                <div className="empty-logs">ยังไม่มีประวัติการใช้งานระบบ</div>
              ) : (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>วัน-เวลา</th>
                      <th>แพลตฟอร์ม</th>
                      <th>ประเภท/สาขา</th>
                      <th>โทนเสียง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageStats.slice(0, 20).map(stat => (
                      <tr key={stat.id}>
                        <td>{new Date(stat.timestamp).toLocaleString('th-TH')}</td>
                        <td><span className={`platform-badge ${stat.platform}`}>{stat.platform}</span></td>
                        <td className="truncate-td">{stat.category}</td>
                        <td>{stat.tone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
