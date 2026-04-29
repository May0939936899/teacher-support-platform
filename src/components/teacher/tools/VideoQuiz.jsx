'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseTime(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseInt(str) || 0;
}

function getYouTubeId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function generateQR(text, canvas) {
  import('qrcode').then(QRCode => {
    QRCode.toCanvas(canvas, text, { width: 200, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
  });
}

function fmtDateTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

// Default datetime-local strings (now / now+20min)
function nowLocal(offsetMs = 0) {
  const d = new Date(Date.now() + offsetMs);
  d.setSeconds(0, 0);
  // Adjust for local timezone offset
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

// Server helpers
async function publishQuizToServer(code, data) {
  const res = await fetch('/api/teacher/videoquiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'publish', code, ...data }),
  });
  return res.ok;
}

async function closeQuizOnServer(code) {
  try {
    await fetch('/api/teacher/videoquiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', code }),
    });
  } catch {}
}

async function fetchSubmissions(code) {
  const res = await fetch('/api/teacher/videoquiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_submissions', code }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.submissions || [];
}

// localStorage — Quiz Library
const LIBRARY_KEY = 'videoquiz_library';
function loadLibrary() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]'); } catch { return []; }
}
function saveLibrary(arr) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(arr)); } catch {}
}

// localStorage — Results history (saved sessions)
const RESULTS_KEY = 'videoquiz_results';
function loadAllResults() {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]'); } catch { return []; }
}
function saveAllResults(arr) {
  try { localStorage.setItem(RESULTS_KEY, JSON.stringify(arr.slice(0, 200))); } catch {}
}
function getResultsByLibraryId(libraryId) {
  return loadAllResults().filter(r => String(r.libraryId) === String(libraryId));
}
function persistSessionResults(libraryId, quizTitle, code, submissions, opensAt, closesAt) {
  if (!submissions || submissions.length === 0) return;
  const all = loadAllResults().filter(r => r.code !== code); // deduplicate by code
  all.unshift({
    id: Date.now(),
    libraryId: String(libraryId),
    quizTitle,
    code,
    submissions,
    opensAt,
    closesAt,
    savedAt: new Date().toISOString(),
  });
  saveAllResults(all);
}

export default function VideoQuiz() {
  // view: 'library' | 'create' | 'published'
  const [view, setView] = useState('library');

  // Library
  const [library, setLibrary] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Create / Edit
  const [videoUrl, setVideoUrl] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);
  const [videoDurationSec, setVideoDurationSec] = useState(0);  // auto-detected
  const detectorPlayerRef = useRef(null);
  const detectorDivId     = useRef('vq-detect-' + Math.random().toString(36).slice(2, 6));

  // ── Auto-detect YouTube duration when URL changes ─────────────────────────
  useEffect(() => {
    setVideoDurationSec(0);
    const ytId = getYouTubeId(videoUrl);
    if (!ytId) return;

    const ensureApi = () => new Promise(resolve => {
      if (window.YT && window.YT.Player) return resolve();
      const existing = document.getElementById('yt-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => resolve();
      const itv = setInterval(() => {
        if (window.YT && window.YT.Player) { clearInterval(itv); resolve(); }
      }, 200);
    });

    let cancelled = false;
    (async () => {
      await ensureApi();
      if (cancelled) return;
      try { detectorPlayerRef.current?.destroy?.(); } catch {}
      const div = document.getElementById(detectorDivId.current);
      if (!div) return;
      detectorPlayerRef.current = new window.YT.Player(detectorDivId.current, {
        videoId: ytId,
        height: '1', width: '1',
        playerVars: { controls: 0 },
        events: {
          onReady: () => {
            try {
              const dur = detectorPlayerRef.current.getDuration() || 0;
              if (dur > 0) setVideoDurationSec(Math.round(dur));
            } catch {}
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      try { detectorPlayerRef.current?.destroy?.(); } catch {}
      detectorPlayerRef.current = null;
    };
  }, [videoUrl]);
  const [questions, setQuestions] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // ===== AI Generate Questions =====
  const aiGenerateQuestions = async () => {
    if (!videoUrl) { toast.error('กรุณาใส่ URL วิดีโอก่อน'); return; }
    const ytId = getYouTubeId(videoUrl);
    if (!ytId) { toast.error('URL ไม่ถูกต้อง'); return; }
    setAiGenerating(true);
    const tid = toast.loading('🤖 AI กำลังสร้างข้อสอบ 3 ข้อ...');
    try {
      // Use auto-detected duration (in minutes) — fallback to 5 min if undetected
      const durationMin = videoDurationSec > 0
        ? Math.max(1, Math.ceil(videoDurationSec / 60))
        : 5;
      const res = await fetch('/api/teacher/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'video_quiz_generator',
          payload: {
            videoTitle: quizTitle || 'วิดีโอการศึกษา',
            topic: quizTitle,
            duration: durationMin,
            numQuestions: 3,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI ตอบกลับผิดปกติ');
      // Strip code fences if present
      let raw = (data.result || '').trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(raw);
      // Strip "จากข้อมูล/ตามวิดีโอ/ในนาที..." preamble before first comma
      const PREAMBLE_KEYWORDS = [
        'จากข้อมูล', 'จากเนื้อหา', 'จากคลิป', 'จากวิดีโอ',
        'ตามที่วิดีโอ', 'ตามที่คลิป', 'ตามวิดีโอ', 'ตามคลิป',
        'ในวิดีโอ', 'ในคลิป', 'ในนาทีที่',
        'ณ เวลา', 'ที่เวลา',
      ];
      const stripPreamble = (s) => {
        if (!s) return s;
        let t = s.trim();
        // Up to 3 passes — handle nested preambles
        for (let pass = 0; pass < 3; pass++) {
          let matched = false;
          for (const kw of PREAMBLE_KEYWORDS) {
            if (t.startsWith(kw)) {
              const commaIdx = t.indexOf(',');
              if (commaIdx > 0 && commaIdx < 80) {
                t = t.slice(commaIdx + 1).trim();
                matched = true;
                break;
              }
            }
          }
          if (!matched) break;
        }
        return t;
      };

      const items = (parsed.questions || []).map((q) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: q.timestamp || '00:00',
        text: stripPreamble(q.text || ''),
        type: 'mc',
        options: (q.options || ['', '', '', '']).slice(0, 4).concat(['', '', '', '']).slice(0, 4),
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: q.explanation || '',
      }));
      if (items.length === 0) throw new Error('AI สร้างข้อสอบไม่ได้');
      setQuestions(prev => [...prev, ...items]);
      toast.success(`✨ เพิ่ม ${items.length} ข้อจาก AI แล้ว`, { id: tid });
    } catch (e) {
      toast.error(`AI ไม่ได้ผล: ${e.message}`, { id: tid });
    } finally {
      setAiGenerating(false);
    }
  };

  // Published
  const [publishedCode, setPublishedCode] = useState('');
  const [publishedLibraryId, setPublishedLibraryId] = useState(null);
  const [publishedOpensAt, setPublishedOpensAt] = useState(null);
  const [publishedClosesAt, setPublishedClosesAt] = useState(null);
  const [liveSubmissions, setLiveSubmissions] = useState([]);
  const [quizClosed, setQuizClosed] = useState(false);
  const qrRef = useRef(null);
  const pollRef = useRef(null);

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [pendingPublishItem, setPendingPublishItem] = useState(null); // null = from create view
  const [scheduleType, setScheduleType] = useState('now'); // 'now' | 'timed'
  const [scheduleDuration, setScheduleDuration] = useState(20); // minutes
  const [scheduleOpenAt, setScheduleOpenAt] = useState('');
  const [scheduleCloseAt, setScheduleCloseAt] = useState('');

  // Results modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsModalItem, setResultsModalItem] = useState(null);

  // Load library on mount
  useEffect(() => { setLibrary(loadLibrary()); }, []);

  // QR Code
  useEffect(() => {
    if (publishedCode && qrRef.current) {
      const url = `${window.location.origin}/student/videoquiz?code=${publishedCode}`;
      generateQR(url, qrRef.current);
    }
  }, [publishedCode, view]);

  // Live polling
  useEffect(() => {
    if (!publishedCode || quizClosed) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      const subs = await fetchSubmissions(publishedCode);
      setLiveSubmissions(subs);
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [publishedCode, quizClosed]);

  // ===== Question builder =====
  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      timestamp: '00:00',
      text: '',
      type: 'mc',
      options: ['', '', '', ''],
      answer: null,
    }]);
  };

  const updateQ = (idx, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[oIdx] = value;
      copy[qIdx] = { ...copy[qIdx], options: opts };
      return copy;
    });
  };

  const removeQ = (idx) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const sortedQuestions = [...questions].sort((a, b) => parseTime(a.timestamp) - parseTime(b.timestamp));

  // ===== Library helpers =====
  const saveToLibrary = () => {
    if (!videoUrl) { toast.error('กรุณาใส่ URL วิดีโอ'); return; }
    if (questions.length === 0) { toast.error('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ'); return; }
    if (questions.some(q => !q.text)) { toast.error('กรุณากรอกคำถามให้ครบ'); return; }

    const current = loadLibrary();
    if (editingId) {
      const updated = current.map(item =>
        item.id === editingId
          ? { ...item, title: quizTitle || 'Video Quiz', videoUrl, questions: sortedQuestions, timeLimit, savedAt: new Date().toISOString() }
          : item
      );
      saveLibrary(updated); setLibrary(updated); toast.success('✅ อัปเดตแล้ว');
    } else {
      const entry = { id: Date.now(), title: quizTitle || 'Video Quiz', videoUrl, questions: sortedQuestions, timeLimit, savedAt: new Date().toISOString() };
      const updated = [...current, entry];
      saveLibrary(updated); setLibrary(updated); toast.success('✅ บันทึกแล้ว');
    }
  };

  const deleteFromLibrary = (id) => {
    if (!window.confirm('ลบ Quiz นี้ออกจากคลังใช่ไหม?')) return;
    const updated = loadLibrary().filter(item => item.id !== id);
    saveLibrary(updated); setLibrary(updated);
  };

  const openForEdit = (item) => {
    setEditingId(item.id); setQuizTitle(item.title); setVideoUrl(item.videoUrl);
    setQuestions(item.questions); setTimeLimit(item.timeLimit ?? 20);
    setView('create');
  };

  const startNewQuiz = () => {
    setEditingId(null); setQuizTitle(''); setVideoUrl('');
    setQuestions([]); setTimeLimit(20); setView('create');
  };

  // ===== Schedule modal =====
  const openScheduleModal = (item = null) => {
    setPendingPublishItem(item);
    setScheduleType('now');
    setScheduleDuration(item?.timeLimit ?? timeLimit ?? 20);
    setScheduleOpenAt(nowLocal(0));
    setScheduleCloseAt(nowLocal((item?.timeLimit ?? timeLimit ?? 20) * 60000));
    setShowScheduleModal(true);
  };

  const handlePublishConfirm = async () => {
    const item = pendingPublishItem;
    const sourceTitle = item ? item.title : (quizTitle || 'Video Quiz');
    const sourceUrl = item ? item.videoUrl : videoUrl;
    const sourceQuestions = item ? item.questions : sortedQuestions;

    if (!sourceUrl) { toast.error('กรุณาใส่ URL วิดีโอ'); return; }
    if (!sourceQuestions.length) { toast.error('กรุณาเพิ่มคำถาม'); return; }
    if (!item) {
      if (sourceQuestions.some(q => !q.text)) { toast.error('กรุณากรอกคำถามให้ครบ'); return; }
      if (sourceQuestions.some(q => (q.type === 'mc' || q.type === 'tf') && q.answer === null)) {
        toast.error('⚠️ มีข้อที่ยังไม่ได้เลือกเฉลย'); return;
      }
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];

    let opensAt, closesAt, timeLimitSec;
    if (scheduleType === 'now') {
      opensAt = null; // open immediately
      timeLimitSec = scheduleDuration > 0 ? scheduleDuration * 60 : 0;
      closesAt = timeLimitSec > 0 ? new Date(Date.now() + timeLimitSec * 1000).toISOString() : null;
    } else {
      opensAt = scheduleOpenAt ? new Date(scheduleOpenAt).toISOString() : null;
      closesAt = scheduleCloseAt ? new Date(scheduleCloseAt).toISOString() : null;
      timeLimitSec = 0;
    }

    const quizData = {
      title: sourceTitle,
      videoUrl: sourceUrl,
      ytId: getYouTubeId(sourceUrl),
      questions: sourceQuestions,
      timeLimit: timeLimitSec,
      opensAt,
      closesAt,
    };

    // Load create view state into published view
    if (item) {
      setQuizTitle(item.title); setVideoUrl(item.videoUrl);
      setQuestions(item.questions); setTimeLimit(item.timeLimit ?? 20);
    }

    const ok = await publishQuizToServer(code, quizData);
    if (!ok) { toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่'); return; }

    setPublishedCode(code);
    setPublishedLibraryId(item ? item.id : editingId);
    setPublishedOpensAt(opensAt);
    setPublishedClosesAt(closesAt);
    setLiveSubmissions([]);
    setQuizClosed(false);
    setShowScheduleModal(false);
    setPendingPublishItem(null);
    setView('published');
    toast.success(`🎬 สร้าง Video Quiz รหัส ${code} แล้ว!`);
  };

  // ===== Published view actions =====
  const handleSaveResults = () => {
    if (liveSubmissions.length === 0) { toast('ยังไม่มีผลที่จะบันทึก'); return; }
    persistSessionResults(publishedLibraryId, quizTitle, publishedCode, liveSubmissions, publishedOpensAt, publishedClosesAt);
    setLibrary(loadLibrary()); // refresh to update result count badge
    toast.success(`💾 บันทึกผล ${liveSubmissions.length} คนแล้ว`);
  };

  const handleCloseAndSave = async () => {
    await closeQuizOnServer(publishedCode);
    setQuizClosed(true);
    clearInterval(pollRef.current);
    if (liveSubmissions.length > 0) {
      persistSessionResults(publishedLibraryId, quizTitle, publishedCode, liveSubmissions, publishedOpensAt, publishedClosesAt);
      toast.success(`🔒 ปิดและบันทึกผล ${liveSubmissions.length} คนแล้ว`);
    } else {
      toast('🔒 ปิดข้อสอบแล้ว');
    }
  };

  const handleBackToLibrary = () => {
    setPublishedCode(''); setPublishedLibraryId(null);
    setPublishedOpensAt(null); setPublishedClosesAt(null);
    setLiveSubmissions([]); setQuizClosed(false);
    setLibrary(loadLibrary()); // refresh result counts
    setView('library');
  };

  // ===== Results modal =====
  const openResultsModal = (item) => {
    setResultsModalItem(item);
    setShowResultsModal(true);
  };

  const ytId = getYouTubeId(videoUrl);

  // ===== SCHEDULE MODAL =====
  const ScheduleModal = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: FONT }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>📅 ตั้งเวลาเปิดข้อสอบ</h3>
        <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '14px' }}>
          {pendingPublishItem ? `"${pendingPublishItem.title}"` : (quizTitle || 'Video Quiz')}
        </p>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          {[
            { type: 'now', label: '⚡ เปิดทันที', color: CI.cyan },
            { type: 'timed', label: '🕐 ตั้งเวลา', color: CI.magenta },
          ].map(({ type, label, color }) => (
            <button key={type} onClick={() => {
              setScheduleType(type);
              if (type === 'timed' && !scheduleOpenAt) {
                setScheduleOpenAt(nowLocal(5 * 60000));
                setScheduleCloseAt(nowLocal((5 + scheduleDuration) * 60000));
              }
            }} style={{
              flex: 1, padding: '14px', borderRadius: '14px', border: `2px solid ${scheduleType === type ? color : '#e2e8f0'}`,
              background: scheduleType === type ? `${color}14` : '#fff', color: scheduleType === type ? color : '#64748b',
              cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: FONT, transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {scheduleType === 'now' && (
          <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
            <label style={{ ...lbl, color: '#475569', marginBottom: '12px' }}>⏱️ ระยะเวลาทำข้อสอบ (นาที)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number" min="0" max="300" value={scheduleDuration}
                onChange={e => setScheduleDuration(Math.max(0, parseInt(e.target.value) || 0))}
                style={{ ...inp, width: '100px', textAlign: 'center', fontWeight: 800, fontSize: '22px', padding: '10px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: scheduleDuration > 0 ? CI.cyan : '#94a3b8' }}>
                  {scheduleDuration > 0 ? `ปิดอัตโนมัติใน ${scheduleDuration} นาที` : 'ไม่จำกัดเวลา'}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  {scheduleDuration > 0 ? `ปิด ~${fmtDateTime(new Date(Date.now() + scheduleDuration * 60000).toISOString())}` : 'ต้องปิดเองด้วยปุ่ม "ปิดข้อสอบ"'}
                </div>
              </div>
            </div>
          </div>
        )}

        {scheduleType === 'timed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '14px', border: '1.5px solid #bbf7d0' }}>
              <label style={{ ...lbl, color: '#16a34a', marginBottom: '8px' }}>🟢 เวลาเปิด</label>
              <input type="datetime-local" value={scheduleOpenAt} onChange={e => setScheduleOpenAt(e.target.value)} style={{ ...inp, borderColor: '#bbf7d0' }} />
            </div>
            <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '14px', border: '1.5px solid #fecaca' }}>
              <label style={{ ...lbl, color: '#ef4444', marginBottom: '8px' }}>🔴 เวลาปิด</label>
              <input type="datetime-local" value={scheduleCloseAt} onChange={e => setScheduleCloseAt(e.target.value)} style={{ ...inp, borderColor: '#fecaca' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setShowScheduleModal(false); setPendingPublishItem(null); }} style={{
            flex: 1, padding: '14px', borderRadius: '14px', border: '2px solid #e2e8f0',
            background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: FONT,
          }}>ยกเลิก</button>
          <button onClick={handlePublishConfirm} style={{
            flex: 2, padding: '14px', borderRadius: '14px', border: 'none',
            background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
            color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '16px', fontFamily: FONT,
            boxShadow: `0 4px 16px ${CI.cyan}40`,
          }}>🚀 เปิดข้อสอบ</button>
        </div>
      </div>
    </div>
  );

  // ===== RESULTS MODAL =====
  const ResultsModal = () => {
    if (!resultsModalItem) return null;
    const sessions = getResultsByLibraryId(resultsModalItem.id);

    const deleteSession = (sessionId) => {
      const all = loadAllResults().filter(r => r.id !== sessionId);
      saveAllResults(all);
      setResultsModalItem({ ...resultsModalItem }); // force re-render
    };

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: FONT }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                📊 ผลลัพธ์ — {resultsModalItem.title}
              </h3>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{sessions.length} ครั้งที่บันทึกไว้</div>
            </div>
            <button onClick={() => setShowResultsModal(false)} style={{
              padding: '8px 16px', borderRadius: '10px', border: '2px solid #e2e8f0',
              background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontFamily: FONT,
            }}>✕ ปิด</button>
          </div>

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '16px' }}>ยังไม่มีผลที่บันทึกไว้</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>หลังเปิด Quiz กด &ldquo;💾 บันทึกผล&rdquo; หรือ &ldquo;🔒 ปิดและบันทึก&rdquo;</div>
            </div>
          ) : (
            sessions.map((sess) => {
              const avg = sess.submissions.length > 0
                ? (sess.submissions.reduce((a, s) => a + (s.score || 0), 0) / sess.submissions.length).toFixed(1)
                : '—';
              const maxScore = sess.submissions[0]?.total || 0;
              return (
                <div key={sess.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px', background: '#fafbfc' }}>
                  {/* Session header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ background: `${CI.cyan}18`, color: CI.cyan, borderRadius: '8px', padding: '3px 10px', fontSize: '13px', fontWeight: 800 }}>
                          {sess.code}
                        </span>
                        <span style={{ color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
                          {fmtDateTime(sess.savedAt)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {sess.opensAt && <span style={{ fontSize: '13px', color: '#16a34a' }}>🟢 เปิด {fmtDateTime(sess.opensAt)}</span>}
                        {sess.closesAt && <span style={{ fontSize: '13px', color: '#ef4444' }}>🔴 ปิด {fmtDateTime(sess.closesAt)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: CI.magenta }}>{sess.submissions.length}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ผู้ส่ง</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: CI.cyan }}>{avg}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>เฉลี่ย/{maxScore}</div>
                      </div>
                      <button onClick={() => deleteSession(sess.id)} style={{
                        padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #fecaca',
                        background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: FONT,
                      }}>🗑️</button>
                    </div>
                  </div>

                  {/* Submissions table */}
                  <div style={{ overflowX: 'auto' }}>
                    {sess.submissions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', marginBottom: '6px', background: '#fff', border: '1px solid #f1f5f9' }}>
                        <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {s.studentId && <span style={{ marginRight: '8px', color: '#64748b' }}>🎫 {s.studentId}</span>}
                            {fmtDateTime(s.submittedAt)}
                          </div>
                        </div>
                        <div style={{
                          padding: '5px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '15px', flexShrink: 0,
                          background: s.score === s.total ? '#dcfce7' : s.score >= s.total / 2 ? `${CI.gold}18` : '#fef2f2',
                          color: s.score === s.total ? '#16a34a' : s.score >= s.total / 2 ? '#92400e' : '#ef4444',
                        }}>{s.score}/{s.total}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ===== LIBRARY VIEW =====
  if (view === 'library') {
    return (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', fontFamily: FONT }}>
        {showScheduleModal && <ScheduleModal />}
        {showResultsModal && <ResultsModal />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📚 คลัง Video Quiz
          </h2>
          <button onClick={startNewQuiz} style={{
            padding: '12px 24px', borderRadius: '14px', border: 'none',
            background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
            color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '16px', fontFamily: FONT,
            boxShadow: `0 4px 16px ${CI.cyan}30`,
          }}>➕ สร้าง Quiz ใหม่</button>
        </div>

        {library.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '60px 24px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
            <div style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 600, marginBottom: '20px' }}>ยังไม่มี Quiz บันทึกไว้</div>
            <button onClick={startNewQuiz} style={{ padding: '14px 32px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '16px', fontFamily: FONT }}>
              ➕ สร้าง Quiz แรกของคุณ
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {library.map((item) => {
              const resultCount = getResultsByLibraryId(item.id).length;
              const totalSubs = getResultsByLibraryId(item.id).reduce((a, r) => a + r.submissions.length, 0);
              return (
                <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexWrap: 'wrap' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {item.title}
                      {resultCount > 0 && (
                        <span style={{ background: `${CI.gold}20`, color: '#92400e', border: `1px solid ${CI.gold}40`, borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
                          📊 {totalSubs} คน ({resultCount} ครั้ง)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>❓ {item.questions.length} ข้อ</span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>⏱️ {item.timeLimit > 0 ? `${item.timeLimit} นาที` : 'ไม่จำกัด'}</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {item.videoUrl}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>บันทึกเมื่อ {new Date(item.savedAt).toLocaleString('th-TH')}</div>
                  </div>
                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => openScheduleModal(item)} style={{
                      padding: '10px 18px', borderRadius: '12px', border: 'none',
                      background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
                      color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: FONT,
                    }}>🚀 เปิด QR</button>
                    <button onClick={() => { openResultsModal(item); }} style={{
                      padding: '10px 18px', borderRadius: '12px',
                      border: `2px solid ${resultCount > 0 ? CI.gold + '60' : '#e2e8f0'}`,
                      background: resultCount > 0 ? `${CI.gold}10` : '#f8fafc',
                      color: resultCount > 0 ? '#92400e' : '#94a3b8',
                      cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: FONT,
                    }}>📊 ดูผล{resultCount > 0 ? ` (${resultCount})` : ''}</button>
                    <button onClick={() => openForEdit(item)} style={{
                      padding: '10px 18px', borderRadius: '12px', border: `2px solid ${CI.cyan}40`,
                      background: `${CI.cyan}08`, color: CI.cyan, cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: FONT,
                    }}>✏️ แก้ไข</button>
                    <button onClick={() => deleteFromLibrary(item.id)} style={{
                      padding: '10px 18px', borderRadius: '12px', border: '2px solid #fecaca',
                      background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: FONT,
                    }}>🗑️ ลบ</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ===== PUBLISHED VIEW =====
  if (view === 'published') {
    const isScheduled = publishedOpensAt && new Date(publishedOpensAt) > new Date();
    const studentUrl = typeof window !== 'undefined' ? `${window.location.origin}/student/videoquiz?code=${publishedCode}` : `/student/videoquiz?code=${publishedCode}`;

    return (
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Main card */}
          <div style={{ background: `linear-gradient(135deg, ${CI.dark}, #1a1a4e)`, borderRadius: '24px', padding: '36px', color: '#fff', textAlign: 'center', marginBottom: '20px', boxShadow: '0 8px 32px rgba(11,11,36,0.3)' }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '6px', letterSpacing: '2px' }}>🎬 VIDEO QUIZ CODE</div>
            <div style={{ fontSize: '60px', fontWeight: 900, letterSpacing: '14px', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {publishedCode}
            </div>
            <div style={{ fontSize: '15px', opacity: 0.8, marginTop: '8px' }}>📝 {questions.length} คำถาม | 🎬 {quizTitle || 'Video Quiz'}</div>

            {/* Schedule info */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
              {isScheduled ? (
                <div style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', color: '#fbbf24' }}>
                  ⏳ จะเปิด {fmtDateTime(publishedOpensAt)}
                </div>
              ) : (
                <div style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', color: '#4ade80' }}>
                  ✅ เปิดอยู่ {publishedOpensAt ? `ตั้งแต่ ${fmtDateTime(publishedOpensAt)}` : 'แล้ว'}
                </div>
              )}
              {publishedClosesAt && (
                <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', color: '#f87171' }}>
                  🔴 ปิด {fmtDateTime(publishedClosesAt)}
                </div>
              )}
              {quizClosed && (
                <div style={{ background: 'rgba(100,116,139,0.3)', border: '1px solid rgba(100,116,139,0.5)', borderRadius: '10px', padding: '8px 16px', fontSize: '14px', color: '#94a3b8' }}>
                  🔒 ปิดแล้ว
                </div>
              )}
            </div>

            <canvas ref={qrRef} style={{ borderRadius: '16px', margin: '20px auto', display: 'block', background: '#fff', padding: '10px' }} />
            <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '6px' }}>นักศึกษาสแกน QR หรือเปิดลิงก์ด้านล่าง</div>
            <div style={{ background: 'rgba(0,180,230,0.12)', border: '1px solid rgba(0,180,230,0.3)', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', color: CI.cyan, fontWeight: 600, wordBreak: 'break-all', margin: '0 auto', maxWidth: '480px' }}>
              {studentUrl}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { navigator.clipboard.writeText(studentUrl); toast.success('📋 คัดลอก URL แล้ว'); }} style={{ padding: '11px 22px', borderRadius: '12px', border: `1px solid ${CI.cyan}40`, background: 'transparent', color: CI.cyan, cursor: 'pointer', fontSize: '14px', fontFamily: FONT, fontWeight: 700 }}>
                📋 คัดลอก URL
              </button>
              <button onClick={() => { navigator.clipboard.writeText(publishedCode); toast.success('คัดลอกรหัส'); }} style={{ padding: '11px 22px', borderRadius: '12px', border: 'none', background: CI.cyan, color: '#fff', cursor: 'pointer', fontSize: '14px', fontFamily: FONT, fontWeight: 700 }}>
                📋 คัดลอกรหัส
              </button>
            </div>
          </div>

          {/* Submissions */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>
              📊 ผู้ส่งคำตอบ ({liveSubmissions.length} คน)
              {!quizClosed && <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8', marginLeft: '8px' }}>🔄 อัปเดตอัตโนมัติ</span>}
            </h4>
            {liveSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '15px' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.5 }}>⏳</div>
                {isScheduled ? 'รอถึงเวลาเปิด...' : 'รอนักศึกษาส่งคำตอบ...'}
              </div>
            ) : (
              <div>
                {liveSubmissions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', marginBottom: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {s.studentId && <span style={{ marginRight: '8px', color: '#64748b', fontWeight: 600 }}>🎫 {s.studentId}</span>}
                        {fmtDateTime(s.submittedAt)}
                      </div>
                    </div>
                    <div style={{ padding: '6px 14px', borderRadius: '10px', fontWeight: 800, fontSize: '16px', background: s.score === s.total ? '#dcfce7' : s.score >= s.total / 2 ? `${CI.gold}15` : '#fef2f2', color: s.score === s.total ? '#16a34a' : s.score >= s.total / 2 ? '#92400e' : '#ef4444' }}>
                      {s.score}/{s.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleSaveResults} disabled={liveSubmissions.length === 0} style={{
              flex: 1, minWidth: '140px', padding: '13px', borderRadius: '14px',
              border: `2px solid ${liveSubmissions.length > 0 ? CI.gold + '60' : '#e2e8f0'}`,
              background: liveSubmissions.length > 0 ? `${CI.gold}12` : '#f8fafc',
              color: liveSubmissions.length > 0 ? '#92400e' : '#94a3b8',
              cursor: liveSubmissions.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: '15px', fontFamily: FONT,
            }}>💾 บันทึกผล ({liveSubmissions.length})</button>
            {!quizClosed && (
              <button onClick={handleCloseAndSave} style={{
                flex: 1, minWidth: '140px', padding: '13px', borderRadius: '14px',
                border: '2px solid #fecaca', background: '#fef2f2',
                color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: FONT,
              }}>🔒 ปิดและบันทึก</button>
            )}
            <button onClick={handleBackToLibrary} style={{
              flex: 1, minWidth: '140px', padding: '13px', borderRadius: '14px', border: 'none',
              background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`,
              color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: FONT,
            }}>← กลับคลัง</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== CREATE / EDIT VIEW =====
  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: FONT }}>
      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>
      {showScheduleModal && <ScheduleModal />}

      <button onClick={() => setView('library')} style={{ marginBottom: '20px', padding: '8px 18px', borderRadius: '10px', border: `2px solid #e2e8f0`, background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: FONT }}>
        ← คลัง
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '22px', color: '#1e293b', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '26px' }}>🎬</span> {editingId ? 'แก้ไข Video Quiz' : 'สร้าง Video Quiz'}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>ชื่อ Quiz</label>
              <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="เช่น Quiz บทที่ 3 - Marketing Mix" style={inp}
                onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
              <div>
                <label style={lbl}>
                  URL วิดีโอ YouTube *
                  {videoDurationSec > 0 && (
                    <span style={{
                      marginLeft: 10, fontSize: 12, fontWeight: 700,
                      color: '#16a34a', background: '#dcfce7',
                      padding: '2px 10px', borderRadius: 12,
                    }}>
                      🎬 วิดีโอ: {Math.floor(videoDurationSec/60)}:{String(videoDurationSec%60).padStart(2,'0')} นาที
                    </span>
                  )}
                </label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inp}
                  onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                {/* Hidden detector — reads actual video duration */}
                <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                  <div id={detectorDivId.current} />
                </div>
              </div>
              <div>
                <label style={lbl}>⏱️ เวลา (นาที)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="number" min="0" max="180" value={timeLimit}
                    onChange={e => setTimeLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ ...inp, width: '80px', textAlign: 'center', fontWeight: 700 }} />
                  <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {timeLimit === 0 ? 'ไม่จำกัด' : `${timeLimit} นาที`}
                  </span>
                </div>
              </div>
            </div>
            {ytId && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
                <iframe src={`https://www.youtube.com/embed/${ytId}`} style={{ width: '100%', height: '280px', border: 'none' }} allowFullScreen title="Video preview" />
              </div>
            )}
          </div>

          {/* Questions */}
          {questions.map((q, idx) => (
            <div key={q.id} style={{ background: '#fff', borderRadius: '16px', padding: '22px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, color: '#fff', borderRadius: '8px', padding: '4px 12px', fontSize: '15px', fontWeight: 800 }}>Q{idx + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', color: '#94a3b8' }}>⏱️</span>
                  <input value={q.timestamp} onChange={e => updateQ(idx, 'timestamp', e.target.value)} placeholder="MM:SS"
                    style={{ ...inp, width: '90px', textAlign: 'center', fontSize: '15px', fontWeight: 700 }} />
                </div>
                <select value={q.type} onChange={e => updateQ(idx, 'type', e.target.value)} style={{ ...inp, width: '160px', fontSize: '14px' }}>
                  <option value="mc">Multiple Choice</option>
                  <option value="tf">True / False</option>
                  <option value="short">Short Answer</option>
                </select>
                <button onClick={() => removeQ(idx)} style={{ marginLeft: 'auto', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px', fontFamily: FONT, fontWeight: 600 }}>🗑️ ลบ</button>
              </div>
              <input value={q.text} onChange={e => updateQ(idx, 'text', e.target.value)} placeholder="พิมพ์คำถาม..."
                style={{ ...inp, marginBottom: '12px' }}
                onFocus={e => e.target.style.borderColor = CI.cyan} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              {q.type === 'mc' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>🎯 คลิกที่วงกลมเพื่อเลือก <b>เฉลย</b></span>
                    {q.answer !== null
                      ? <span style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', background: `${CI.cyan}18`, color: CI.cyan, border: `1.5px solid ${CI.cyan}50` }}>✓ เฉลย: ข้อ {String.fromCharCode(65 + q.answer)}</span>
                      : <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>⚠ ยังไม่ได้เลือกเฉลย</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, oi) => {
                      const isCorrect = q.answer === oi;
                      return (
                        <div key={oi} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: isCorrect ? `${CI.cyan}10` : 'transparent', borderRadius: '12px', padding: isCorrect ? '4px 8px 4px 4px' : '0', border: `2px solid ${isCorrect ? CI.cyan + '60' : 'transparent'}`, transition: 'all 0.2s' }}>
                          <div onClick={() => updateQ(idx, 'answer', oi)} style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, cursor: 'pointer', flexShrink: 0, background: isCorrect ? CI.cyan : '#f1f5f9', color: isCorrect ? '#fff' : '#94a3b8', boxShadow: isCorrect ? `0 4px 12px ${CI.cyan}50` : 'none', transition: 'all 0.15s' }}>
                            {isCorrect ? '✓' : String.fromCharCode(65 + oi)}
                          </div>
                          <input value={opt} onChange={e => updateOption(idx, oi, e.target.value)} placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                            style={{ ...inp, flex: 1, fontWeight: isCorrect ? 700 : 400, background: isCorrect ? '#fff' : undefined }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {q.type === 'tf' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>🎯 เลือกเฉลย:</span>
                    {q.answer !== null
                      ? <span style={{ fontSize: '13px', fontWeight: 800, padding: '3px 12px', borderRadius: '20px', background: `${CI.cyan}18`, color: CI.cyan, border: `1.5px solid ${CI.cyan}50` }}>✓ เฉลย: {q.answer === 0 ? 'ถูก (True)' : 'ผิด (False)'}</span>
                      : <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>⚠ ยังไม่ได้เลือก</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[{ label: '✓ ถูก (True)', val: 0 }, { label: '✗ ผิด (False)', val: 1 }].map(({ label, val }) => (
                      <button key={val} onClick={() => updateQ(idx, 'answer', val)} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 700, fontFamily: FONT, cursor: 'pointer', border: `2px solid ${q.answer === val ? CI.cyan : '#e2e8f0'}`, background: q.answer === val ? `${CI.cyan}12` : '#fff', color: q.answer === val ? CI.cyan : '#64748b', boxShadow: q.answer === val ? `0 4px 14px ${CI.cyan}30` : 'none', transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {q.type === 'short' && (
                <div>
                  <label style={{ ...lbl, color: '#16a34a', marginBottom: '6px' }}>✏️ เฉลย (ใช้ตรวจอัตโนมัติ)</label>
                  <input value={typeof q.answer === 'string' ? q.answer : ''} onChange={e => updateQ(idx, 'answer', e.target.value)}
                    placeholder="พิมพ์คำตอบที่ถูกต้อง..." style={{ ...inp, borderColor: q.answer ? '#16a34a' : undefined }} />
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ระบบจะตรวจโดยเทียบตัวอักษร (ตรงตัว — ไม่สนตัวใหญ่/เล็ก)</div>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={aiGenerateQuestions}
              disabled={aiGenerating || !videoUrl}
              style={{
                flex: 1, minWidth: '160px', padding: '16px', borderRadius: '14px', border: 'none',
                background: aiGenerating
                  ? '#e2e8f0'
                  : (videoUrl ? `linear-gradient(135deg, ${CI.purple}, ${CI.magenta})` : '#e2e8f0'),
                color: (aiGenerating || !videoUrl) ? '#94a3b8' : '#fff',
                cursor: (aiGenerating || !videoUrl) ? 'not-allowed' : 'pointer',
                fontWeight: 800, fontSize: '15px', fontFamily: FONT,
                boxShadow: (videoUrl && !aiGenerating) ? `0 4px 16px ${CI.purple}40` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {aiGenerating ? (
                <>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  กำลังสร้าง...
                </>
              ) : '🤖 AI สร้างข้อสอบ 3 ข้ออัตโนมัติ'}
            </button>
            <button onClick={addQuestion} style={{ flex: '0 0 auto', minWidth: '120px', padding: '16px', borderRadius: '14px', border: `2px dashed ${CI.cyan}30`, background: `${CI.cyan}04`, color: CI.cyan, cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: FONT }}>
              + เพิ่มเอง
            </button>
            <button onClick={saveToLibrary} disabled={questions.length === 0} style={{ flex: 1, minWidth: '160px', padding: '16px', borderRadius: '14px', border: `2px solid ${questions.length > 0 ? CI.gold : '#e2e8f0'}`, background: questions.length > 0 ? `${CI.gold}12` : '#f8fafc', color: questions.length > 0 ? '#92400e' : '#94a3b8', cursor: questions.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: '16px', fontFamily: FONT }}>
              {editingId ? '💾 อัปเดต' : '💾 บันทึกลงคลัง'}
            </button>
            <button onClick={() => questions.length > 0 && openScheduleModal(null)} disabled={questions.length === 0} style={{ flex: 1, minWidth: '160px', padding: '16px', borderRadius: '14px', border: 'none', background: questions.length > 0 ? `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})` : '#e2e8f0', color: questions.length > 0 ? '#fff' : '#94a3b8', cursor: questions.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: '17px', fontFamily: FONT, boxShadow: questions.length > 0 ? `0 4px 16px ${CI.cyan}30` : 'none' }}>
              🚀 เผยแพร่ Quiz ({questions.length} ข้อ)
            </button>
          </div>
        </div>

        {/* Timeline sidebar */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '18px', color: '#1e293b', fontWeight: 700 }}>⏱️ Timeline</h4>
          {sortedQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '15px' }}>เพิ่มคำถามเพื่อดู Timeline</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: `linear-gradient(to bottom, ${CI.cyan}, ${CI.magenta})` }} />
              {sortedQuestions.map((q, idx) => (
                <div key={q.id} style={{ position: 'relative', marginBottom: '20px', paddingLeft: '14px' }}>
                  <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: `linear-gradient(135deg, ${CI.cyan}, ${CI.magenta})`, border: '2px solid #fff', boxShadow: `0 0 0 2px ${CI.cyan}` }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: CI.cyan }}>{q.timestamp}</div>
                  <div style={{ fontSize: '14px', color: '#1e293b', marginTop: '2px', fontWeight: 600 }}>{q.text || `คำถามข้อ ${idx + 1}`}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{q.type === 'mc' ? 'MC' : q.type === 'tf' ? 'T/F' : 'Short'}</span>
                    {(q.type === 'mc' || q.type === 'tf') && (
                      q.answer !== null
                        ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ {q.type === 'mc' ? `ข้อ ${String.fromCharCode(65 + q.answer)}` : q.answer === 0 ? 'ถูก' : 'ผิด'}</span>
                        : <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠ ไม่มีเฉลย</span>
                    )}
                    {q.type === 'short' && q.answer && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ มีเฉลย</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl = { fontSize: '15px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '8px' };
const inp = {
  width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid #e2e8f0',
  fontSize: '16px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', fontFamily: 'inherit',
  transition: 'border 0.2s',
};
