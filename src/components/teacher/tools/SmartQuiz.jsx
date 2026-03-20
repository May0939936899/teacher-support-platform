'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

function getBrowserFingerprint() {
  const nav = navigator;
  const str = [nav.userAgent, nav.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset()].join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(36);
}

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, { width: 220, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }, err => { if (err) console.error(err); });
  });
}

export default function SmartQuiz() {
  const [mode, setMode] = useState('teacher');
  const [quiz, setQuiz] = useState({ title: '', description: '', timeLimit: 30, questions: [] });
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [studentView, setStudentView] = useState({ sessionCode: '', step: 'join', answers: {}, submitted: false });
  const qrRef = useRef(null);
  const fileRef = useRef(null);

  // AI Generate states
  const [createMode, setCreateMode] = useState('manual'); // manual | ai
  const [aiFile, setAiFile] = useState(null);
  const [aiFilePreview, setAiFilePreview] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiNumQ, setAiNumQ] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('ปานกลาง');
  const [aiTypes, setAiTypes] = useState({ MC: true, TF: true, SHORT: false });
  const [aiLoading, setAiLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const QUIZ_API = '/api/teacher/smartquiz';

  // Load sessions from API
  useEffect(() => {
    fetch(`${QUIZ_API}?action=list`).then(r => r.json()).then(data => {
      if (data.sessions) setSessions(data.sessions);
    }).catch(() => {});
  }, []);

  const saveSessions = (s) => { setSessions(s); };

  // ===== FILE HANDLING =====
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['pdf', 'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'txt', 'text'];
    if (!validExts.includes(ext)) { toast.error('รองรับไฟล์ .pdf, .pptx, .png, .jpg, .txt เท่านั้น'); return; }

    setAiFile(file);
    setAiFilePreview(null);
    setExtractedText('');

    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      // Image → show preview + will use vision API
      const reader = new FileReader();
      reader.onload = (ev) => setAiFilePreview(ev.target.result);
      reader.readAsDataURL(file);
      toast.success(`โหลดรูป ${file.name} แล้ว — AI จะวิเคราะห์จากรูปภาพ`);
    } else if (ext === 'pdf') {
      // === PDF: Read client-side with pdf.js v3 UMD build (classic script, works everywhere) ===
      toast('กำลังอ่าน PDF...');
      try {
        // Load pdf.js v3 UMD (classic, non-ESM) — exposes window.pdfjsLib directly
        const loadPdfJs = () => new Promise((resolve, reject) => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            return resolve(window.pdfjsLib);
          }
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            if (window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              resolve(window.pdfjsLib);
            } else {
              reject(new Error('pdfjsLib not found after script load'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load pdf.js CDN'));
          document.head.appendChild(script);
          setTimeout(() => reject(new Error('pdf.js load timeout (15s)')), 15000);
        });

        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const numPages = pdf.numPages;

        let allText = '';
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(' ');
          if (pageText.trim()) {
            allText += `[หน้า ${i}]\n${pageText}\n\n`;
          }
        }

        if (allText.trim().length < 30) {
          // Try server-side as fallback for small files (might extract more text)
          if (file.size <= 4 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/teacher/extract-pdf', { method: 'POST', body: formData });
            if (res.ok) {
              const result = await res.json();
              if (result.text && result.text.trim().length > 20) {
                setExtractedText(result.text);
                setAiText(result.text);
                toast.success(`อ่าน PDF สำเร็จ (${result.numPages} หน้า)`);
                return;
              }
            }
          }
          toast.error('PDF นี้อาจเป็นแบบสแกน (รูปภาพ) ไม่มีข้อความให้อ่าน\nลอง copy-paste เนื้อหา หรือใช้รูปภาพแทน', { duration: 5000 });
        } else {
          const trimmedText = allText.length > 50000 ? allText.substring(0, 50000) + '\n\n[...ข้อความถูกตัดเนื่องจากยาวเกินไป]' : allText;
          setExtractedText(trimmedText);
          setAiText(trimmedText);
          toast.success(`อ่าน PDF สำเร็จ (${numPages} หน้า, ${allText.length.toLocaleString()} ตัวอักษร)`);
        }
      } catch (err) {
        console.error('PDF parse error:', err);
        // Fallback: try server-side for files under 4MB
        try {
          if (file.size <= 4 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/teacher/extract-pdf', { method: 'POST', body: formData });
            if (res.ok) {
              const result = await res.json();
              if (result.text && result.text.trim().length > 20) {
                setExtractedText(result.text);
                setAiText(result.text);
                toast.success(`อ่าน PDF สำเร็จ (${result.numPages} หน้า, ${result.totalChars.toLocaleString()} ตัวอักษร)`);
                return;
              }
            }
          }
        } catch (e2) {
          console.error('Server-side fallback also failed:', e2);
        }
        toast.error(`อ่าน PDF ไม่สำเร็จ: ${err.message}\nลอง copy-paste เนื้อหาแทน`, { duration: 5000 });
      }
    } else if (ext === 'pptx' || ext === 'ppt' || ext === 'txt' || ext === 'text') {
      // PPTX and TXT: use server-side (usually small files)
      const fileLabel = ext.includes('ppt') ? 'PowerPoint' : 'Text';
      toast(`กำลังอ่าน ${fileLabel}...`);
      try {
        if (ext === 'txt' || ext === 'text') {
          // TXT: read directly client-side
          const text = await file.text();
          setExtractedText(text);
          setAiText(text);
          toast.success(`อ่าน Text สำเร็จ (${text.length.toLocaleString()} ตัวอักษร)`);
        } else {
          // PPTX: use server if under 4MB, else try client-side JSZip
          if (file.size <= 4 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/teacher/extract-pdf', { method: 'POST', body: formData });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || `อ่าน ${fileLabel} ไม่สำเร็จ`);
            if (result.text && result.text.trim().length > 10) {
              setExtractedText(result.text);
              setAiText(result.text);
              toast.success(`อ่าน ${fileLabel} สำเร็จ (${result.numSlides} slides, ${result.totalChars.toLocaleString()} ตัวอักษร)`);
            } else {
              toast.error(`ไม่พบข้อความใน ${fileLabel} — ลอง copy-paste เนื้อหาแทน`);
            }
          } else {
            toast.error(`ไฟล์ ${fileLabel} ใหญ่เกิน 4MB — ลอง copy-paste เนื้อหาแทน`, { duration: 5000 });
          }
        }
      } catch (err) {
        console.error('File extract error:', err);
        toast.error(`อ่าน ${fileLabel} ไม่สำเร็จ: ${err.message}\nลอง copy-paste เนื้อหาแทน`, { duration: 5000 });
      }
    }
  };

  // ===== AI SUMMARIZE CONTENT FROM IMAGE/FILE =====
  const [aiSummarizing, setAiSummarizing] = useState(false);

  const summarizeWithAI = async () => {
    if (!aiFilePreview && !extractedText && aiText.trim().length < 10) {
      toast.error('กรุณาอัพโหลดไฟล์ หรือวางเนื้อหาก่อน');
      return;
    }

    setAiSummarizing(true);
    try {
      let body;
      const isImage = aiFilePreview && !extractedText;

      if (isImage) {
        // Use vision to read & summarize image
        const base64 = aiFilePreview.split(',')[1];
        const mediaType = aiFilePreview.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        body = {
          tool: 'image_to_content',
          payload: { imageBase64: base64, mediaType },
        };
      } else {
        // Summarize text content
        body = {
          tool: 'content_summarizer',
          payload: { content: aiText || extractedText },
        };
      }

      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      setAiText(data.result);
      setExtractedText(data.result);
      toast.success('AI สรุปเนื้อหาสำเร็จ! พร้อมสร้างข้อสอบ');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setAiSummarizing(false);
    }
  };

  // ===== AI GENERATE =====
  const generateWithAI = async () => {
    const selectedTypes = Object.keys(aiTypes).filter(k => aiTypes[k]);
    if (selectedTypes.length === 0) { toast.error('เลือกประเภทคำถามอย่างน้อย 1 แบบ'); return; }

    // Determine if we use vision or text
    const isImage = aiFilePreview && !extractedText;
    const hasText = aiText.trim().length > 20 || extractedText.trim().length > 20;
    if (!isImage && !hasText) { toast.error('กรุณาอัพโหลดไฟล์ หรือวางเนื้อหาก่อน (อย่างน้อย 20 ตัวอักษร)'); return; }

    setAiLoading(true);
    try {
      let body;
      if (isImage) {
        // Vision API
        const base64 = aiFilePreview.split(',')[1];
        const mediaType = aiFilePreview.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        body = {
          tool: 'quiz_generator_vision',
          payload: {
            imageBase64: base64,
            mediaType,
            numQuestions: aiNumQ,
            difficulty: aiDifficulty,
            questionTypes: selectedTypes,
          },
        };
      } else {
        body = {
          tool: 'quiz_generator',
          payload: {
            content: aiText || extractedText,
            numQuestions: aiNumQ,
            difficulty: aiDifficulty,
            questionTypes: selectedTypes,
          },
        };
      }

      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      // Parse JSON from response
      const jsonMatch = data.result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI ตอบไม่ตรง format');
      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.questions || parsed.questions.length === 0) throw new Error('ไม่พบคำถามในผลลัพธ์');

      // Merge AI-generated questions into quiz
      const newQuestions = parsed.questions.map((q, i) => ({
        id: Date.now().toString() + '_' + i,
        type: q.type || 'MC',
        text: q.text,
        options: q.options || ['', '', '', ''],
        answer: q.answer || '',
        points: q.points || 1,
        explanation: q.explanation || '',
      }));

      setQuiz(prev => ({
        ...prev,
        questions: [...prev.questions, ...newQuestions],
      }));

      toast.success(`AI สร้าง ${newQuestions.length} ข้อสำเร็จ!`);
      setCreateMode('manual'); // Switch to manual to review/edit
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ===== QUIZ MANAGEMENT =====
  const addQuestion = () => {
    setQuiz(q => ({
      ...q,
      questions: [...q.questions, { id: Date.now().toString(), type: 'MC', text: '', options: ['', '', '', ''], answer: '', points: 1 }],
    }));
  };

  const updateQuestion = (idx, field, value) => {
    setQuiz(q => { const qs = [...q.questions]; qs[idx] = { ...qs[idx], [field]: value }; return { ...q, questions: qs }; });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuiz(q => { const qs = [...q.questions]; const opts = [...qs[qIdx].options]; opts[oIdx] = value; qs[qIdx] = { ...qs[qIdx], options: opts }; return { ...q, questions: qs }; });
  };

  const removeQuestion = (idx) => { setQuiz(q => ({ ...q, questions: q.questions.filter((_, i) => i !== idx) })); };

  const moveQuestion = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= quiz.questions.length) return;
    setQuiz(q => {
      const qs = [...q.questions];
      [qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]];
      return { ...q, questions: qs };
    });
  };

  const startSession = async () => {
    if (!quiz.title || quiz.questions.length === 0) { toast.error('กรุณากรอกชื่อ Quiz และเพิ่มคำถามอย่างน้อย 1 ข้อ'); return; }
    const emptyQ = quiz.questions.find(q => !q.text.trim());
    if (emptyQ) { toast.error('มีคำถามที่ยังไม่ได้กรอก กรุณาตรวจสอบ'); return; }
    try {
      const res = await fetch(QUIZ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: { ...quiz }, timeLimit: quiz.timeLimit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessions(prev => [data.session, ...prev]);
      setActiveSession(data.session);
      toast.success(`สร้าง Session สำเร็จ! Code: ${data.code}`);
    } catch (err) {
      toast.error(err.message || 'ไม่สามารถสร้าง Session');
    }
  };

  const endSession = async (sessionId) => {
    try {
      await fetch(QUIZ_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: sessionId, action: 'close' }),
      });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, active: false } : s));
      if (activeSession?.id === sessionId) setActiveSession({ ...activeSession, active: false });
      toast('ปิด Session แล้ว');
    } catch { toast.error('ไม่สามารถปิด Session'); }
  };

  const joinSession = async () => {
    const code = studentView.sessionCode.toUpperCase();
    try {
      const res = await fetch(`${QUIZ_API}?code=${code}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'ไม่พบ Session หรือหมดเวลาแล้ว'); return; }
      const session = data.session;
      const fp = getBrowserFingerprint();
      if ((session.responses || []).some(r => r.fingerprint === fp)) { toast.error('คุณได้ตอบคำถามนี้ไปแล้ว'); return; }
      setStudentView(v => ({ ...v, step: 'quiz', session, fingerprint: fp }));
    } catch {
      toast.error('ไม่พบ Session หรือหมดเวลาแล้ว');
    }
  };

  const submitAnswers = async () => {
    const session = studentView.session;
    if (!session) return;
    const fp = studentView.fingerprint || getBrowserFingerprint();
    try {
      const res = await fetch(QUIZ_API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: session.id, fingerprint: fp, answers: studentView.answers }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'ไม่สามารถส่งคำตอบ'); return; }
      setStudentView(v => ({ ...v, submitted: true, score: data.score, total: data.total }));
      toast.success('ส่งคำตอบแล้ว!');
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
    }
  };

  useEffect(() => {
    if (activeSession && qrRef.current) {
      const url = `${window.location.origin}/teacher?quiz=${activeSession.id}`;
      generateQR(url, qrRef.current);
    }
  }, [activeSession]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const quizCode = params.get('quiz');
      if (quizCode) { setMode('student'); setStudentView(v => ({ ...v, sessionCode: quizCode })); }
    }
  }, []);

  const totalPoints = quiz.questions.reduce((a, q) => a + (q.points || 1), 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {[{ id: 'teacher', label: '👩‍🏫 อาจารย์' }, { id: 'student', label: '👨‍🎓 นักศึกษา' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: mode === m.id ? '#fff' : 'none',
            color: mode === m.id ? CI.purple : '#64748b',
            fontWeight: mode === m.id ? 700 : 400, fontSize: '16px', fontFamily: 'inherit',
            boxShadow: mode === m.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
          }}>{m.label}</button>
        ))}
      </div>

      {/* ===== TEACHER MODE ===== */}
      {mode === 'teacher' && (
        <div style={{ display: 'grid', gridTemplateColumns: activeSession ? '1fr 380px' : '1fr', gap: '24px' }}>
          <div>
            {/* Step 1: Choose creation mode — prominent visual selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Card: Manual */}
                <button onClick={() => setCreateMode('manual')} style={{
                  padding: '28px 20px', borderRadius: '20px',
                  border: `3px solid ${createMode === 'manual' ? CI.cyan : '#e2e8f0'}`,
                  background: createMode === 'manual' ? `linear-gradient(135deg, ${CI.cyan}08, ${CI.cyan}15)` : '#fff',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s', fontFamily: 'inherit',
                  boxShadow: createMode === 'manual' ? `0 8px 24px ${CI.cyan}20` : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: createMode === 'manual' ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (createMode !== 'manual') { e.currentTarget.style.borderColor = CI.cyan + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { if (createMode !== 'manual') { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; } }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✏️</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: createMode === 'manual' ? CI.cyan : '#1e293b', marginBottom: '6px' }}>สร้างเอง</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>พิมพ์คำถามและตัวเลือกทีละข้อ<br/>เหมาะสำหรับข้อสอบเฉพาะทาง</div>
                  {createMode === 'manual' && <div style={{ marginTop: '10px', fontSize: '13px', color: CI.cyan, fontWeight: 700 }}>✓ เลือกแล้ว</div>}
                </button>
                {/* Card: AI */}
                <button onClick={() => setCreateMode('ai')} style={{
                  padding: '28px 20px', borderRadius: '20px',
                  border: `3px solid ${createMode === 'ai' ? CI.purple : '#e2e8f0'}`,
                  background: createMode === 'ai' ? `linear-gradient(135deg, ${CI.purple}08, ${CI.magenta}10)` : '#fff',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s', fontFamily: 'inherit',
                  boxShadow: createMode === 'ai' ? `0 8px 24px ${CI.purple}20` : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: createMode === 'ai' ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (createMode !== 'ai') { e.currentTarget.style.borderColor = CI.purple + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { if (createMode !== 'ai') { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; } }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: createMode === 'ai' ? CI.purple : '#1e293b', marginBottom: '6px' }}>AI สร้างจากเนื้อหา</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>อัปโหลดไฟล์ / วางเนื้อหา<br/>AI อ่าน สรุป แล้วสร้างข้อสอบให้</div>
                  {createMode === 'ai' && <div style={{ marginTop: '10px', fontSize: '13px', color: CI.purple, fontWeight: 700 }}>✓ เลือกแล้ว</div>}
                </button>
              </div>

              {/* Quiz info — card */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📝 ข้อมูล Quiz
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input placeholder="ชื่อ Quiz *" value={quiz.title} onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))} style={inp} />
                  <input placeholder="คำอธิบาย (ไม่บังคับ)" value={quiz.description} onChange={e => setQuiz(q => ({ ...q, description: e.target.value }))} style={inp} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <label style={{ fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>⏱️ เวลา:</label>
                  <input type="number" min="5" max="180" value={quiz.timeLimit}
                    onChange={e => setQuiz(q => ({ ...q, timeLimit: parseInt(e.target.value) || 30 }))}
                    style={{ ...inp, width: '80px', textAlign: 'center' }} />
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>นาที</span>
                </div>
              </div>
            </div>

            {/* ===== AI GENERATE PANEL ===== */}
            {createMode === 'ai' && (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: `2px solid ${CI.cyan}30`, marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
                  ✨ AI สร้างข้อสอบอัตโนมัติ
                </h4>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.6 }}>
                  อัพโหลดไฟล์ PPT, PDF, รูปภาพ หรือ Text → AI จะวิเคราะห์เนื้อหาและสร้างข้อสอบให้อัตโนมัติ
                </p>

                {/* File upload zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${aiFile ? CI.cyan : '#cbd5e1'}`,
                    borderRadius: '14px', padding: '28px', textAlign: 'center',
                    cursor: 'pointer', marginBottom: '16px', transition: 'all 0.2s',
                    background: aiFile ? `${CI.cyan}06` : '#f8fafc',
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = CI.cyan; e.currentTarget.style.background = `${CI.cyan}10`; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = aiFile ? CI.cyan : '#cbd5e1'; e.currentTarget.style.background = aiFile ? `${CI.cyan}06` : '#f8fafc'; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = aiFile ? CI.cyan : '#cbd5e1'; if (e.dataTransfer.files[0]) handleFile({ target: { files: e.dataTransfer.files } }); }}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg,.txt,.text" onChange={handleFile} style={{ display: 'none' }} />
                  {!aiFile ? (
                    <>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                        ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
                      </div>
                      <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                        รองรับ: .pdf .pptx .png .jpg .txt
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '28px' }}>
                        {aiFile.name.endsWith('.pdf') ? '📕' : aiFile.name.match(/\.pptx?$/) ? '📊' : aiFile.name.match(/\.(png|jpg|jpeg)$/) ? '🖼️' : '📄'}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{aiFile.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {(aiFile.size / 1024).toFixed(0)} KB
                          {extractedText && ` • ${extractedText.length} ตัวอักษร`}
                          {aiFilePreview && !extractedText && ' • พร้อมส่ง AI วิเคราะห์'}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setAiFile(null); setAiFilePreview(null); setExtractedText(''); setAiText(''); }}
                        style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
                        ✕ ลบ
                      </button>
                    </div>
                  )}
                </div>

                {/* Image preview */}
                {aiFilePreview && (
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <img src={aiFilePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}

                {/* Or paste text */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>หรือวางเนื้อหาเอง</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  </div>
                  <textarea
                    placeholder="วางเนื้อหาจาก slide, เอกสาร, หรือบทเรียนที่นี่..."
                    value={aiText}
                    onChange={e => { setAiText(e.target.value); setExtractedText(''); }}
                    style={{ ...inp, minHeight: '120px', resize: 'vertical', lineHeight: 1.7 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {aiText.length} ตัวอักษร {aiText.length > 0 && aiText.length < 20 && <span style={{ color: CI.magenta }}>• ต้องมีอย่างน้อย 20 ตัวอักษร</span>}
                    </div>
                  </div>
                </div>

                {/* AI Summarize button */}
                {(aiFilePreview || aiText.length > 10 || extractedText.length > 10) && (
                  <button onClick={summarizeWithAI} disabled={aiSummarizing} style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: `2px solid ${CI.purple}30`,
                    background: aiSummarizing ? '#f1f5f9' : `linear-gradient(135deg, ${CI.purple}10, ${CI.cyan}10)`,
                    color: aiSummarizing ? '#94a3b8' : CI.purple,
                    cursor: aiSummarizing ? 'wait' : 'pointer', fontWeight: 700, fontSize: '16px', fontFamily: 'inherit',
                    marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}>
                    {aiSummarizing ? (
                      <>🔄 AI กำลังอ่านและสรุปเนื้อหา...</>
                    ) : (
                      <>🧠 AI อ่านและสรุปเนื้อหาสำคัญ (เตรียมออกข้อสอบ)</>
                    )}
                  </button>
                )}

                {/* AI Options */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>⚙️ ตั้งค่า AI</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={lbl}>จำนวนข้อ</label>
                      <select value={aiNumQ} onChange={e => setAiNumQ(parseInt(e.target.value))} style={inp}>
                        {[3, 5, 7, 10, 15, 20].map(n => <option key={n} value={n}>{n} ข้อ</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>ระดับความยาก</label>
                      <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} style={inp}>
                        {['ง่าย', 'ปานกลาง', 'ยาก', 'ผสม'].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>ประเภทคำถาม</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'MC', label: 'ปรนัย (MC)', icon: '🔘' },
                        { key: 'TF', label: 'ถูก/ผิด (TF)', icon: '✅' },
                        { key: 'SHORT', label: 'เขียนตอบ', icon: '📝' },
                      ].map(t => (
                        <label key={t.key} style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                          borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                          background: aiTypes[t.key] ? `${CI.cyan}12` : '#fff',
                          border: `1.5px solid ${aiTypes[t.key] ? CI.cyan : '#e2e8f0'}`,
                          color: aiTypes[t.key] ? CI.cyan : '#64748b', transition: 'all 0.15s',
                        }}>
                          <input type="checkbox" checked={aiTypes[t.key]}
                            onChange={e => setAiTypes(prev => ({ ...prev, [t.key]: e.target.checked }))}
                            style={{ accentColor: CI.cyan }} />
                          {t.icon} {t.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate button */}
                <button onClick={generateWithAI} disabled={aiLoading} style={{
                  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                  background: aiLoading ? '#94a3b8' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                  color: '#fff', cursor: aiLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  {aiLoading ? (
                    <>⏳ AI กำลังสร้างข้อสอบ...</>
                  ) : (
                    <>✨ สร้างข้อสอบด้วย AI ({aiNumQ} ข้อ)</>
                  )}
                </button>
              </div>
            )}

            {/* ===== QUESTIONS LIST ===== */}
            {quiz.questions.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '17px', color: '#1e293b', fontWeight: 700 }}>
                    📋 คำถาม ({quiz.questions.length} ข้อ • {totalPoints} คะแนน)
                  </h4>
                  <button onClick={() => { setQuiz(q => ({ ...q, questions: [] })); toast('ลบคำถามทั้งหมดแล้ว'); }}
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600 }}>
                    🗑 ล้างทั้งหมด
                  </button>
                </div>

                {quiz.questions.map((q, idx) => (
                  <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff', borderRadius: '8px', padding: '4px 12px', fontSize: '13px', fontWeight: 700 }}>
                        ข้อ {idx + 1}
                      </span>
                      <select value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}
                        style={{ ...inp, flex: 1, fontSize: '14px', minWidth: '140px' }}>
                        <option value="MC">Multiple Choice</option>
                        <option value="TF">True/False</option>
                        <option value="SHORT">Short Answer</option>
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" min="1" max="10" value={q.points}
                          onChange={e => updateQuestion(idx, 'points', parseInt(e.target.value) || 1)}
                          style={{ ...inp, width: '60px', fontSize: '14px', textAlign: 'center' }} title="คะแนน" />
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>pts</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}
                          style={{ ...miniBtn, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveQuestion(idx, 1)} disabled={idx === quiz.questions.length - 1}
                          style={{ ...miniBtn, opacity: idx === quiz.questions.length - 1 ? 0.3 : 1 }}>↓</button>
                        <button onClick={() => removeQuestion(idx)} style={{ ...miniBtn, background: '#fee2e2', color: '#ef4444' }}>✕</button>
                      </div>
                    </div>

                    <textarea placeholder="คำถาม *" value={q.text}
                      onChange={e => updateQuestion(idx, 'text', e.target.value)}
                      style={{ ...inp, minHeight: '60px', resize: 'vertical', lineHeight: 1.6, fontSize: '15px' }} />

                    {q.type === 'MC' && (
                      <div style={{ marginTop: '12px' }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: 700, flexShrink: 0,
                              background: q.answer === String.fromCharCode(65 + oi) ? CI.cyan : '#f1f5f9',
                              color: q.answer === String.fromCharCode(65 + oi) ? '#fff' : '#64748b',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }} onClick={() => updateQuestion(idx, 'answer', String.fromCharCode(65 + oi))}>
                              {String.fromCharCode(65 + oi)}
                            </div>
                            <input placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                              value={opt} onChange={e => updateOption(idx, oi, e.target.value)}
                              style={{ ...inp, flex: 1, fontSize: '15px' }} />
                          </div>
                        ))}
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          💡 คลิกตัวอักษร A-D เพื่อเลือกคำตอบที่ถูก {q.answer && <span style={{ color: CI.cyan, fontWeight: 600 }}>— เฉลย: {q.answer}</span>}
                        </div>
                      </div>
                    )}

                    {q.type === 'TF' && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        {['True', 'False'].map(opt => (
                          <button key={opt} onClick={() => updateQuestion(idx, 'answer', opt)} style={{
                            flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                            fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
                            border: `2px solid ${q.answer === opt ? CI.cyan : '#e2e8f0'}`,
                            background: q.answer === opt ? `${CI.cyan}10` : '#fff',
                            color: q.answer === opt ? CI.cyan : '#64748b',
                          }}>
                            {opt === 'True' ? '✓ ถูก' : '✗ ผิด'}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'SHORT' && (
                      <input placeholder="แนวเฉลย (สำหรับ AI ตรวจ)" value={q.answer}
                        onChange={e => updateQuestion(idx, 'answer', e.target.value)}
                        style={{ ...inp, marginTop: '12px', fontSize: '15px' }} />
                    )}

                    {/* Explanation if from AI */}
                    {q.explanation && (
                      <div style={{ marginTop: '10px', background: `${CI.gold}12`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#92400e' }}>
                        💡 <strong>เฉลย:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={addQuestion} style={{
                flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                background: '#fff', color: CI.cyan, border: `2px dashed ${CI.cyan}`,
                fontSize: '16px', fontWeight: 600, fontFamily: 'inherit',
              }}>
                + เพิ่มคำถาม
              </button>
              <button onClick={startSession} style={{
                flex: 1, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                fontSize: '16px', fontWeight: 700, fontFamily: 'inherit',
              }}>
                🚀 เริ่ม Session {quiz.questions.length > 0 && `(${quiz.questions.length} ข้อ)`}
              </button>
            </div>
          </div>

          {/* Active session + QR */}
          {activeSession && (
            <div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: `2px solid ${CI.cyan}30`, marginBottom: '16px', textAlign: 'center' }}>
                <div style={{
                  background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, borderRadius: '12px',
                  padding: '16px', marginBottom: '16px', color: '#fff',
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '4px' }}>Session Code</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '6px' }}>{activeSession.id}</div>
                </div>
                <canvas ref={qrRef} style={{ borderRadius: '12px', display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  ⏱️ หมดเวลา: {new Date(activeSession.expiresAt).toLocaleTimeString('th-TH')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => {
                    const url = `${window.location.origin}/teacher?quiz=${activeSession.id}`;
                    navigator.clipboard.writeText(url); toast.success('คัดลอก URL แล้ว');
                  }} style={{ ...actionBtn, background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0' }}>
                    📋 คัดลอก URL
                  </button>
                  <button onClick={() => endSession(activeSession.id)}
                    style={{ ...actionBtn, background: '#fee2e2', color: '#dc2626' }}>
                    ⏹ ปิด Session
                  </button>
                </div>
              </div>

              {/* Live results */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: '#1e293b', fontWeight: 700 }}>
                  📊 ผลแบบ Live ({sessions.find(s => s.id === activeSession.id)?.responses?.length || 0} คน)
                </h3>
                {(sessions.find(s => s.id === activeSession.id)?.responses || []).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '15px' }}>
                    <span style={{ color: '#64748b' }}>คนที่ {i + 1}</span>
                    <span style={{ fontWeight: 700, color: CI.cyan }}>{r.score} คะแนน</span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{new Date(r.submittedAt).toLocaleTimeString('th-TH')}</span>
                  </div>
                ))}
                {(sessions.find(s => s.id === activeSession.id)?.responses || []).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '24px 0' }}>
                    ⏳ รอนักศึกษาตอบ...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== STUDENT MODE ===== */}
      {mode === 'student' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {studentView.step === 'join' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📝</div>
              <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '22px' }}>เข้าร่วม Quiz</h2>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '16px' }}>กรอก Session Code ที่อาจารย์ให้</p>
              <input placeholder="Session Code" value={studentView.sessionCode}
                onChange={e => setStudentView(v => ({ ...v, sessionCode: e.target.value.toUpperCase() }))}
                style={{ ...inp, fontSize: '28px', textAlign: 'center', letterSpacing: '8px', fontWeight: 800, marginBottom: '16px', padding: '16px' }} />
              <button onClick={joinSession} style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
              }}>
                เข้าร่วม →
              </button>
            </div>
          )}

          {studentView.step === 'quiz' && !studentView.submitted && (
            <div>
              <div style={{
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff',
                borderRadius: '16px', padding: '24px', marginBottom: '20px',
              }}>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px' }}>{studentView.session?.quiz.title}</h2>
                <p style={{ margin: 0, opacity: 0.85, fontSize: '15px' }}>{studentView.session?.quiz.description}</p>
              </div>
              {studentView.session?.quiz.questions.map((q, idx) => (
                <div key={q.id} style={{ background: '#fff', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
                    <span style={{
                      background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                      borderRadius: '8px', padding: '4px 12px', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                    }}>
                      ข้อ {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', borderRadius: '6px', padding: '4px 10px' }}>
                      {q.points} คะแนน
                    </span>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: '16px', color: '#1e293b', lineHeight: 1.7 }}>{q.text}</p>

                  {q.type === 'MC' && q.options.map((opt, oi) => (
                    opt && (
                      <label key={oi} style={{
                        display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px',
                        borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                        border: `2px solid ${studentView.answers[q.id] === String.fromCharCode(65 + oi) ? CI.cyan : '#e2e8f0'}`,
                        background: studentView.answers[q.id] === String.fromCharCode(65 + oi) ? `${CI.cyan}10` : '#fff',
                        transition: 'all 0.15s',
                      }}>
                        <input type="radio" name={`sq_${q.id}`}
                          checked={studentView.answers[q.id] === String.fromCharCode(65 + oi)}
                          onChange={() => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: String.fromCharCode(65 + oi) } }))}
                          style={{ accentColor: CI.cyan }} />
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{String.fromCharCode(65 + oi)}.</span>
                        <span style={{ fontSize: '15px' }}>{opt}</span>
                      </label>
                    )
                  ))}

                  {q.type === 'TF' && ['True', 'False'].map(opt => (
                    <label key={opt} style={{
                      display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px',
                      borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                      border: `2px solid ${studentView.answers[q.id] === opt ? CI.cyan : '#e2e8f0'}`,
                      background: studentView.answers[q.id] === opt ? `${CI.cyan}10` : '#fff',
                    }}>
                      <input type="radio" name={`sq_${q.id}`}
                        checked={studentView.answers[q.id] === opt}
                        onChange={() => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: opt } }))}
                        style={{ accentColor: CI.cyan }} />
                      <span style={{ fontSize: '15px' }}>{opt === 'True' ? '✓ ถูก' : '✗ ผิด'}</span>
                    </label>
                  ))}

                  {q.type === 'SHORT' && (
                    <textarea placeholder="พิมพ์คำตอบที่นี่..."
                      value={studentView.answers[q.id] || ''}
                      onChange={e => setStudentView(v => ({ ...v, answers: { ...v.answers, [q.id]: e.target.value } }))}
                      style={{ ...inp, minHeight: '80px', resize: 'vertical', fontSize: '15px', lineHeight: 1.6 }} />
                  )}
                </div>
              ))}
              <button onClick={submitAnswers} style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, color: '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: '17px', fontFamily: 'inherit',
              }}>
                ✅ ส่งคำตอบ
              </button>
            </div>
          )}

          {studentView.submitted && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', border: `2px solid ${CI.cyan}30`, textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ color: CI.cyan, margin: '0 0 8px', fontSize: '24px' }}>ส่งคำตอบแล้ว!</h2>
              <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '16px' }}>ขอบคุณที่ตอบแบบทดสอบ</p>
              <div style={{ background: `${CI.cyan}10`, borderRadius: '16px', padding: '24px', display: 'inline-block' }}>
                <div style={{ fontSize: '56px', fontWeight: 800, color: CI.cyan }}>{studentView.score}/{studentView.total}</div>
                <div style={{ color: '#64748b', fontSize: '16px' }}>คะแนน</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past sessions */}
      {mode === 'teacher' && sessions.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', color: '#1e293b', margin: 0, fontWeight: 700 }}>📋 Session ที่ผ่านมา</h3>
            {sessions.some(s => !s.active || Date.now() >= s.expiresAt) && (
              <button onClick={async () => {
                await fetch(`${QUIZ_API}?action=closed`, { method: 'DELETE' });
                setSessions(prev => prev.filter(s => s.active && Date.now() < (s.expires_at || s.expiresAt)));
                toast('ลบ Session ที่ปิดแล้วทั้งหมด');
              }} style={{
                background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px',
                padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', fontWeight: 600,
              }}>
                🗑 ลบที่ปิดแล้วทั้งหมด
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map(s => {
              const isActive = s.active && Date.now() < s.expiresAt;
              return (
                <div key={s.id} style={{
                  background: '#fff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                    background: isActive ? '#dcfce7' : '#f1f5f9',
                    color: isActive ? '#16a34a' : '#94a3b8',
                  }}>
                    {isActive ? '🟢 Active' : 'ปิดแล้ว'}
                  </span>
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>{s.quiz.title}</span>
                  <span style={{ color: '#64748b', fontSize: '14px', marginLeft: 'auto' }}>Code: <b>{s.id}</b></span>
                  <span style={{ color: '#64748b', fontSize: '14px' }}>{s.responses.length} คน</span>
                  {!isActive && (
                    <button onClick={async () => {
                      await fetch(`${QUIZ_API}?code=${s.id}`, { method: 'DELETE' });
                      setSessions(prev => prev.filter(x => x.id !== s.id));
                      toast('ลบ Session แล้ว');
                    }} style={{
                      background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px',
                      padding: '5px 10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                    }}>
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize: '14px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' };
const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit' };
const actionBtn = { padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', width: '100%' };
const miniBtn = { background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '14px', color: '#64748b', fontFamily: 'inherit' };
