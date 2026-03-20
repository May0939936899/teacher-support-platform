'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const CATS = [
  { id:'chief', emoji:'😼', name:'บอสเหมียว', role:'Chief Strategist', color:'#FDCB6E' },
  { id:'creative', emoji:'🎀', name:'แมวครีเอเตอร์', role:'Content Creator', color:'#E17055' },
  { id:'coder', emoji:'🤖', name:'แมวโปรแกรมเมอร์', role:'Coder', color:'#00CEC9' },
  { id:'analyst', emoji:'🧐', name:'แมวนักวิเคราะห์', role:'Analyst', color:'#6C5CE7' },
  { id:'research', emoji:'🕵️', name:'แมวสายสืบ', role:'Research', color:'#0984E3' },
  { id:'qa', emoji:'👮', name:'แมวตรวจงาน', role:'QA', color:'#D63031' },
  { id:'store', emoji:'🏪', name:'แมวจัดการร้าน', role:'Store Ops', color:'#00B894' },
  { id:'live', emoji:'🎤', name:'แมว Live', role:'Live Commerce', color:'#E84393' },
  { id:'planner', emoji:'📋', name:'แมวจัดเวลา', role:'Planner', color:'#FDCB6E' },
  { id:'voc', emoji:'👂', name:'แมว VOC', role:'VOC', color:'#00CEC9' },
];

// Bot message component that re-renders on content change
function BotMessage({ content }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && content) {
      // Simple markdown to HTML
      let html = content
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3,-3).replace(/^\w+\n/,'')}</code></pre>`)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\|(.+)\|/g, (match) => {
          const cells = match.split('|').filter(c=>c.trim());
          if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
          return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
        })
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      html = '<p>' + html + '</p>';
      html = html.replace(/<p><\/p>/g,'');
      html = html.replace(/(<li>.*?<\/li>)+/gs, m => `<ul>${m}</ul>`);
      html = html.replace(/(<tr>.*?<\/tr>)+/gs, m => `<table>${m}</table>`);
      ref.current.innerHTML = html;
    }
  }, [content]);
  return <div ref={ref} />;
}

export default function CatsPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');
  const [activeCats, setActiveCats] = useState([]);
  const [model, setModel] = useState('...');
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ chats: 0, tokens: 0 });
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Init — test API
  useEffect(() => {
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping' }),
    })
      .then(r => r.json())
      .then(d => setModel(d.modelUsed === 'claude' ? 'Claude' : 'Gemini'))
      .catch(() => setModel('Error'));

    addActivity('🟢', 'ระบบพร้อม — ทีมขุนแมว 10 ตัว online');
  }, []);

  // Activity log
  function addActivity(icon, text) {
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setActivities(prev => [{ icon, text, time }, ...prev].slice(0, 40));
  }

  // Send message with streaming
  async function sendMessage() { return sendMessageDirect(input.trim()); }

  async function sendMessageDirect(msg) {
    if (!msg || isStreaming) return;
    const cat = selectedCat !== 'all' ? CATS.find(c => c.id === selectedCat) : null;
    const fullMsg = cat ? `[คุยกับ ${cat.name}] ${msg}` : msg;

    setInput('');
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    addActivity('👤', msg.substring(0, 50) + (msg.length > 50 ? '...' : ''));

    // Mark working
    if (selectedCat === 'all') setActiveCats(CATS.map(c => c.id));
    else setActiveCats([selectedCat]);

    // Add streaming bot message
    const botMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMsg, history, fileContent: fileContent || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API Error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'meta') {
              setModel(data.model === 'claude' ? 'Claude' : 'Gemini');
            } else if (data.type === 'text') {
              fullText += data.text;
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.streaming) {
                  updated[updated.length - 1] = { ...last, content: fullText };
                }
                return updated;
              });
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: data.fullText || fullText, streaming: false };
                return updated;
              });
            } else if (data.type === 'error') {
              fullText = `⚠️ ${data.error}\n\nกำลังลองใหม่...`;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: false };
                return updated;
              });
            }
          } catch (e) { /* skip parse errors */ }
        }
      }

      setStats(prev => ({ chats: prev.chats + 1, tokens: prev.tokens + fullText.length }));
      addActivity('🐱', 'ตอบแล้ว — ' + fullText.substring(0, 40) + '...');

      if (fileContent) { setFileContent(null); setFileName(null); }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `⚠️ เกิดข้อผิดพลาด: ${err.message}\n\nลองใหม่อีกครั้งนะครับ`,
          streaming: false,
        };
        return updated;
      });
      addActivity('⚠️', err.message);
    }

    setIsStreaming(false);
    setActiveCats([]);
  }

  // File upload
  function handleFile(file) {
    if (!file || file.size > 2 * 1024 * 1024) return alert('ไฟล์ใหญ่เกิน 2MB');
    const reader = new FileReader();
    reader.onload = e => {
      const c = e.target.result;
      setFileContent(c.length > 6000 ? c.substring(0, 6000) + `\n[...ตัด ${c.length.toLocaleString()} ตัวอักษร]` : c);
      setFileName(file.name);
      addActivity('📎', `แนบ: ${file.name}`);
    };
    reader.readAsText(file);
  }

  // Quick send — pass text directly
  function quickSend(text) { sendMessageDirect(text); }

  // Render markdown
  function renderMarkdown(text) {
    if (!text) return { __html: '' };
    // Simple markdown renderer (no external dependency)
    let html = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Code blocks
      .replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3,-3).replace(/^\w+\n/,'')}</code></pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bullet lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      // Tables (basic)
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(c=>c.trim());
        if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
        const tag = cells.length > 0 ? 'td' : 'td';
        return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
      })
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraph
    html = '<p>' + html + '</p>';
    // Clean up empty tags
    html = html.replace(/<p><\/p>/g, '').replace(/<p><h/g,'<h').replace(/<\/h2><\/p>/g,'</h2>').replace(/<\/h3><\/p>/g,'</h3>');
    // Wrap consecutive li in ul
    html = html.replace(/(<li>.*?<\/li>)+/gs, m => `<ul>${m}</ul>`);
    // Wrap consecutive tr in table
    html = html.replace(/(<tr>.*?<\/tr>)+/gs, m => `<table>${m}</table>`);

    return { __html: html };
  }

  return (
    <>
      <style>{`
        .cats-app { display:flex; flex-direction:column; height:100vh; background:#0A0F1E; color:#DFE6EE; font-family:'Prompt',sans-serif; }
        .cats-header { height:52px; background:linear-gradient(135deg,#0E1328,#161E3A); border-bottom:1px solid rgba(108,92,231,.2); display:flex; align-items:center; justify-content:space-between; padding:0 20px; flex-shrink:0; }
        .cats-header-logo { font-size:1.1rem; font-weight:700; background:linear-gradient(90deg,#FDCB6E,#E17055,#6C5CE7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .cats-header-right { display:flex; align-items:center; gap:12px; font-size:.78rem; }
        .cats-badge { padding:3px 10px; border-radius:14px; font-size:.68rem; font-weight:600; }
        .cats-badge.online { background:rgba(0,206,201,.15); color:#00CEC9; border:1px solid rgba(0,206,201,.3); }
        .cats-badge.model { background:rgba(108,92,231,.15); color:#A29BFE; }

        /* ROSTER */
        .roster { display:flex; gap:5px; padding:10px 16px; background:rgba(14,19,40,.9); border-bottom:1px solid rgba(108,92,231,.15); flex-shrink:0; overflow-x:auto; }
        .roster-btn { display:flex; flex-direction:column; align-items:center; padding:6px 10px; border-radius:10px; min-width:62px; cursor:pointer; border:2px solid transparent; transition:.2s; background:rgba(0,0,0,.2); }
        .roster-btn:hover { background:rgba(108,92,231,.1); }
        .roster-btn.selected { border-color:#6C5CE7; background:rgba(108,92,231,.15); }
        .roster-btn.working { animation:catPulse 1s infinite; }
        @keyframes catPulse { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 12px rgba(0,206,201,.3)} }
        .roster-emoji { font-size:1.3rem; margin-bottom:2px; }
        .roster-name { font-size:.55rem; font-weight:600; white-space:nowrap; }
        .roster-dot { width:6px; height:6px; border-radius:50%; background:#576574; margin-top:3px; transition:.3s; }
        .roster-btn.selected .roster-dot { background:#6C5CE7; }
        .roster-btn.working .roster-dot { background:#00CEC9; box-shadow:0 0 6px #00CEC9; }

        /* MAIN */
        .cats-main { flex:1; display:flex; overflow:hidden; }
        .chat-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
        .chat-to { padding:8px 20px; background:rgba(0,0,0,.15); border-bottom:1px solid rgba(108,92,231,.1); font-size:.82rem; color:#8395A7; flex-shrink:0; }
        .chat-to strong { color:#00CEC9; }

        /* MESSAGES */
        .msgs { flex:1; overflow-y:auto; padding:16px 20px; }
        .msg { display:flex; gap:10px; margin-bottom:16px; max-width:82%; animation:fadeIn .25s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1} }
        .msg.user { margin-left:auto; flex-direction:row-reverse; }
        .msg-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; }
        .msg.user .msg-avatar { background:rgba(108,92,231,.2); }
        .msg.bot .msg-avatar { background:rgba(253,203,110,.1); }
        .msg-bubble { padding:12px 16px; border-radius:14px; line-height:1.7; font-size:.92rem; position:relative; }
        .msg.user .msg-bubble { background:#1a2744; border:1px solid rgba(108,92,231,.15); border-bottom-right-radius:4px; }
        .msg.bot .msg-bubble { background:#141C30; border:1px solid rgba(0,206,201,.08); border-bottom-left-radius:4px; }
        .msg-bubble h2 { font-size:1rem; margin:10px 0 5px; color:#FDCB6E; }
        .msg-bubble h3 { font-size:.9rem; margin:8px 0 4px; color:#00CEC9; }
        .msg-bubble strong { color:#FDCB6E; }
        .msg-bubble table { width:100%; border-collapse:collapse; margin:8px 0; font-size:.8rem; }
        .msg-bubble th { background:rgba(108,92,231,.15); padding:5px 8px; text-align:left; border:1px solid rgba(108,92,231,.1); }
        .msg-bubble td { padding:4px 8px; border:1px solid rgba(255,255,255,.05); }
        .msg-bubble code { background:rgba(108,92,231,.15); padding:1px 4px; border-radius:3px; font-size:.82rem; }
        .msg-bubble pre { background:rgba(0,0,0,.4); border-radius:6px; padding:10px; margin:6px 0; overflow-x:auto; }
        .msg-bubble ul,.msg-bubble ol { padding-left:16px; margin:5px 0; }
        .msg-bubble blockquote { border-left:3px solid #6C5CE7; padding-left:10px; color:#8395A7; margin:6px 0; }
        .msg-copy { position:absolute; top:4px; right:4px; background:rgba(255,255,255,.08); border:none; color:#8395A7; font-size:.6rem; padding:2px 6px; border-radius:4px; cursor:pointer; opacity:0; transition:.2s; }
        .msg-bubble:hover .msg-copy { opacity:1; }
        .streaming-cursor::after { content:'▊'; animation:blink .7s infinite; color:#00CEC9; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* TYPING */
        .typing { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
        .typing-dots { display:flex; gap:3px; }
        .typing-dot { width:6px; height:6px; border-radius:50%; background:#00CEC9; animation:bounce 1.2s infinite; }
        .typing-dot:nth-child(2){animation-delay:.15s} .typing-dot:nth-child(3){animation-delay:.3s}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-4px);opacity:1} }

        /* WELCOME */
        .welcome { text-align:center; padding:40px 16px; }
        .welcome h1 { font-size:1.3rem; background:linear-gradient(90deg,#FDCB6E,#6C5CE7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin:10px 0 6px; }
        .welcome p { color:#8395A7; font-size:.9rem; line-height:1.6; }
        .quick-btns { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-top:16px; }
        .quick-btn { padding:7px 14px; border-radius:18px; background:rgba(108,92,231,.1); border:1px solid rgba(108,92,231,.2); color:#A29BFE; font-size:.78rem; cursor:pointer; transition:.2s; }
        .quick-btn:hover { background:rgba(108,92,231,.2); border-color:#6C5CE7; }

        /* INPUT */
        .input-bar { padding:12px 16px; background:#0E1328; border-top:1px solid rgba(108,92,231,.15); display:flex; align-items:flex-end; gap:8px; flex-shrink:0; }
        .input-attach { width:38px; height:38px; border-radius:8px; background:rgba(108,92,231,.1); border:1px solid rgba(108,92,231,.2); color:#A29BFE; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .input-attach:hover { background:rgba(108,92,231,.2); }
        .input-area { flex:1; background:rgba(0,0,0,.3); border:2px solid rgba(108,92,231,.2); border-radius:12px; padding:8px 12px; transition:.2s; }
        .input-area:focus-within { border-color:#6C5CE7; box-shadow:0 0 12px rgba(108,92,231,.1); }
        .input-area textarea { width:100%; background:none; border:none; outline:none; color:#DFE6EE; font-family:inherit; font-size:.95rem; line-height:1.5; resize:none; min-height:22px; max-height:80px; }
        .input-area textarea::placeholder { color:rgba(255,255,255,.3); }
        .send-btn { width:38px; height:38px; border-radius:8px; background:linear-gradient(135deg,#6C5CE7,#5A4BD1); border:none; color:white; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:.2s; }
        .send-btn:hover:not(:disabled) { transform:scale(1.05); }
        .send-btn:disabled { opacity:.3; }
        .file-tag { display:flex; align-items:center; gap:4px; padding:3px 8px; border-radius:12px; background:rgba(108,92,231,.1); border:1px solid rgba(108,92,231,.2); font-size:.7rem; color:#A29BFE; }
        .file-tag button { background:none; border:none; color:#8395A7; cursor:pointer; font-size:.8rem; }

        /* RIGHT PANEL */
        .right-panel { width:260px; background:#0E1328; border-left:1px solid rgba(108,92,231,.15); display:flex; flex-direction:column; overflow:hidden; }
        .panel-section { padding:12px 14px; border-bottom:1px solid rgba(108,92,231,.1); }
        .panel-title { font-size:.7rem; font-weight:600; color:#6C5CE7; letter-spacing:1px; text-transform:uppercase; margin-bottom:8px; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .stat-card { background:rgba(0,0,0,.2); border-radius:8px; padding:8px 10px; text-align:center; border:1px solid rgba(108,92,231,.1); }
        .stat-num { font-size:1.1rem; font-weight:700; color:#FDCB6E; }
        .stat-label { font-size:.6rem; color:#8395A7; margin-top:2px; }
        .activity-list { flex:1; overflow-y:auto; padding:6px 10px; }
        .activity-item { display:flex; gap:6px; padding:5px 6px; font-size:.72rem; border-radius:4px; margin-bottom:2px; }
        .activity-icon { flex-shrink:0; }
        .activity-text { color:#8395A7; flex:1; line-height:1.4; }
        .activity-time { font-size:.58rem; color:rgba(255,255,255,.2); }

        @media (max-width:900px) { .right-panel { display:none; } }
      `}</style>

      <div className="cats-app">
        {/* HEADER */}
        <div className="cats-header">
          <div className="cats-header-logo">🐱 BOSS MAY — AI Cat Team</div>
          <div className="cats-header-right">
            <span className="cats-badge online">🟢 Online</span>
            <span className="cats-badge model">{model === 'Claude' ? '🟣' : '🔵'} {model}</span>
            <span style={{color:'#FDCB6E',fontSize:'.72rem'}}>10 agents</span>
          </div>
        </div>

        {/* ROSTER */}
        <div className="roster">
          <div
            className={`roster-btn ${selectedCat === 'all' ? 'selected' : ''}`}
            onClick={() => setSelectedCat('all')}
          >
            <span className="roster-emoji">🐱</span>
            <span className="roster-name">ALL</span>
            <div className="roster-dot" />
          </div>
          {CATS.map(c => (
            <div
              key={c.id}
              className={`roster-btn ${selectedCat === c.id ? 'selected' : ''} ${activeCats.includes(c.id) ? 'working' : ''}`}
              onClick={() => setSelectedCat(c.id)}
            >
              <span className="roster-emoji">{c.emoji}</span>
              <span className="roster-name">{c.name}</span>
              <div className="roster-dot" />
            </div>
          ))}
        </div>

        {/* MAIN */}
        <div className="cats-main">
          {/* CHAT */}
          <div className="chat-panel">
            <div className="chat-to">
              คุยกับ: <strong>
                {selectedCat === 'all' ? '🐱 ทีมขุนแมวทั้งหมด' : `${CATS.find(c=>c.id===selectedCat)?.emoji} ${CATS.find(c=>c.id===selectedCat)?.name}`}
              </strong>
              {selectedCat === 'all' ? ' — AI จะเลือกแมวที่เหมาะสม' : ` — ${CATS.find(c=>c.id===selectedCat)?.role}`}
            </div>

            <div className="msgs">
              {messages.length === 0 && (
                <div className="welcome">
                  <div style={{fontSize:'2.5rem'}}>🐱</div>
                  <h1>สวัสดีครับ BOSS MAY!</h1>
                  <p>ทีมขุนแมว AI พร้อมช่วยงานทุกด้าน<br/>เลือกแมวด้านบน หรือพิมพ์คำสั่งได้เลย</p>
                  <div className="quick-btns">
                    <button className="quick-btn" onClick={()=>quickSend('วิเคราะห์ยอดขายไตรมาส 1')}>📊 วิเคราะห์ยอดขาย</button>
                    <button className="quick-btn" onClick={()=>quickSend('วางแผนโปรโมชัน 7.7')}>🎯 วางแผนโปรโมชัน</button>
                    <button className="quick-btn" onClick={()=>quickSend('สร้างคอนเทนต์ IG 5 โพสต์')}>🎨 สร้างคอนเทนต์</button>
                    <button className="quick-btn" onClick={()=>quickSend('วางแผน Live ขาย TikTok')}>🎤 วางแผน Live</button>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={`${i}-${m.content?.length || 0}`} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
                  <div className="msg-avatar">{m.role === 'user' ? '👤' : '🐱'}</div>
                  <div className={`msg-bubble ${m.streaming ? 'streaming-cursor' : ''}`}>
                    <button className="msg-copy" onClick={e => { navigator.clipboard.writeText(m.content); e.target.textContent='✅'; setTimeout(()=>e.target.textContent='📋',1500); }}>📋</button>
                    {m.role === 'assistant' ? (
                      <BotMessage content={m.content} />
                    ) : (
                      <div>{m.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && messages[messages.length-1]?.content === '' && (
                <div className="typing">
                  <div className="msg-avatar" style={{background:'rgba(253,203,110,.1)'}}>🐱</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',background:'#141C30',borderRadius:'14px'}}>
                    <div className="typing-dots"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
                    <span style={{fontSize:'.78rem',color:'#8395A7'}}>กำลังคิด...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="input-bar">
              <button className="input-attach" onClick={() => fileInputRef.current?.click()}>📎</button>
              <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".txt,.csv,.md,.json,.log,.html,.xml,.js,.py,.tsv,.xlsx"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

              <div className="input-area">
                {fileName && (
                  <div className="file-tag">
                    📄 {fileName}
                    <button onClick={() => { setFileContent(null); setFileName(null); }}>✕</button>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="พิมพ์คำถาม หรือสั่งงานได้เลย..."
                  rows={1}
                  onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,80)+'px'; }}
                />
              </div>
              <button className="send-btn" onClick={sendMessage} disabled={isStreaming || !input.trim()}>➤</button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="right-panel">
            <div className="panel-section">
              <div className="panel-title">📊 Dashboard</div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-num">{stats.chats}</div>
                  <div className="stat-label">Chats</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{(stats.tokens/1000).toFixed(1)}k</div>
                  <div className="stat-label">Characters</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">10</div>
                  <div className="stat-label">Agents</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num" style={{color:'#00CEC9'}}>●</div>
                  <div className="stat-label">Online</div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-title">📡 Activity Log</div>
            </div>
            <div className="activity-list">
              {activities.map((a, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon">{a.icon}</span>
                  <span className="activity-text">{a.text}</span>
                  <span className="activity-time">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
