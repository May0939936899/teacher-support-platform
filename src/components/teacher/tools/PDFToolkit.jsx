'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

const TABS = [
  { key: 'merge', label: '\u0e23\u0e27\u0e21\u0e44\u0e1f\u0e25\u0e4c', icon: '\ud83d\udcc2' },
  { key: 'split', label: '\u0e41\u0e22\u0e01\u0e44\u0e1f\u0e25\u0e4c', icon: '\u2702\ufe0f' },
  { key: 'watermark', label: '\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33', icon: '\ud83d\udca7' },
];

async function getPdfLib() {
  const mod = await import('pdf-lib');
  return mod;
}

export default function PDFToolkit() {
  const [activeTab, setActiveTab] = useState('merge');

  // --- Merge state ---
  const [mergeFiles, setMergeFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const mergeRef = useRef(null);

  // --- Split state ---
  const [splitFile, setSplitFile] = useState(null);
  const [splitFileName, setSplitFileName] = useState('');
  const [splitPageCount, setSplitPageCount] = useState(0);
  const [splitRanges, setSplitRanges] = useState('');
  const [splitting, setSplitting] = useState(false);
  const splitRef = useRef(null);

  // --- Watermark state ---
  const [wmFile, setWmFile] = useState(null);
  const [wmFileName, setWmFileName] = useState('');
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(50);
  const [wmOpacity, setWmOpacity] = useState(0.3);
  const [wmPosition, setWmPosition] = useState('center');
  const [watermarking, setWatermarking] = useState(false);
  const wmRef = useRef(null);

  const [dragOverIdx, setDragOverIdx] = useState(null);
  const dragItem = useRef(null);

  // --- Merge functions ---
  const handleMergeFiles = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (files.length === 0) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF');
    const newEntries = files.map(f => ({ id: Date.now().toString() + Math.random(), file: f, name: f.name }));
    setMergeFiles(prev => [...prev, ...newEntries]);
    toast.success(`\u0e40\u0e1e\u0e34\u0e48\u0e21 ${files.length} \u0e44\u0e1f\u0e25\u0e4c`);
  };

  const removeMergeFile = (id) => setMergeFiles(prev => prev.filter(f => f.id !== id));

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx) => {
    const from = dragItem.current;
    if (from === null || from === idx) { setDragOverIdx(null); return; }
    setMergeFiles(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(idx, 0, item);
      return arr;
    });
    setDragOverIdx(null);
    dragItem.current = null;
  };

  const doMerge = async () => {
    if (mergeFiles.length < 2) return toast.error('\u0e15\u0e49\u0e2d\u0e07\u0e21\u0e35\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 2 \u0e44\u0e1f\u0e25\u0e4c');
    setMerging(true);
    try {
      const { PDFDocument } = await getPdfLib();
      const merged = await PDFDocument.create();
      for (const entry of mergeFiles) {
        const buf = await entry.file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(bytes, 'merged.pdf');
      toast.success('\u0e23\u0e27\u0e21\u0e44\u0e1f\u0e25\u0e4c\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08!');
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setMerging(false);
    }
  };

  // --- Split functions ---
  const handleSplitFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !(file.type === 'application/pdf' || file.name.endsWith('.pdf'))) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF');
    setSplitFile(file);
    setSplitFileName(file.name);
    try {
      const { PDFDocument } = await getPdfLib();
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      setSplitPageCount(doc.getPageCount());
      toast.success(`\u0e42\u0e2b\u0e25\u0e14\u0e41\u0e25\u0e49\u0e27 (${doc.getPageCount()} \u0e2b\u0e19\u0e49\u0e32)`);
    } catch (err) {
      toast.error('\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e2d\u0e48\u0e32\u0e19 PDF: ' + err.message);
    }
  };

  const doSplit = async () => {
    if (!splitFile) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e44\u0e1f\u0e25\u0e4c PDF');
    if (!splitRanges.trim()) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e23\u0e30\u0e1a\u0e38\u0e0a\u0e48\u0e27\u0e07\u0e2b\u0e19\u0e49\u0e32 \u0e40\u0e0a\u0e48\u0e19 1-3, 5-7, 10');
    setSplitting(true);
    try {
      const { PDFDocument } = await getPdfLib();
      const buf = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf);

      const ranges = splitRanges.split(',').map(r => r.trim()).filter(Boolean);
      for (const range of ranges) {
        const match = range.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (!match) { toast.error(`\u0e0a\u0e48\u0e27\u0e07\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07: ${range}`); continue; }
        const start = parseInt(match[1]) - 1;
        const end = match[2] ? parseInt(match[2]) - 1 : start;
        if (start < 0 || end >= srcDoc.getPageCount() || start > end) {
          toast.error(`\u0e2b\u0e19\u0e49\u0e32\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07: ${range}`);
          continue;
        }
        const indices = [];
        for (let i = start; i <= end; i++) indices.push(i);

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const fileName = splitFileName.replace('.pdf', '') + `_pages_${start + 1}-${end + 1}.pdf`;
        downloadBlob(bytes, fileName);
      }
      toast.success('\u0e41\u0e22\u0e01\u0e44\u0e1f\u0e25\u0e4c\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08!');
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setSplitting(false);
    }
  };

  // --- Watermark functions ---
  const handleWmFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !(file.type === 'application/pdf' || file.name.endsWith('.pdf'))) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF');
    setWmFile(file);
    setWmFileName(file.name);
    toast.success('\u0e42\u0e2b\u0e25\u0e14\u0e41\u0e25\u0e49\u0e27');
  };

  const doWatermark = async () => {
    if (!wmFile) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e44\u0e1f\u0e25\u0e4c PDF');
    if (!wmText.trim()) return toast.error('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e43\u0e2a\u0e48\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33');
    setWatermarking(true);
    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await getPdfLib();
      const buf = await wmFile.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();

      pages.forEach(page => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(wmText, wmFontSize);
        const textHeight = wmFontSize;
        let x, y, rotate;

        if (wmPosition === 'center') {
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          rotate = degrees(-45);
        } else if (wmPosition === 'top-left') {
          x = 40; y = height - 60; rotate = degrees(0);
        } else if (wmPosition === 'top-right') {
          x = width - textWidth - 40; y = height - 60; rotate = degrees(0);
        } else if (wmPosition === 'bottom-left') {
          x = 40; y = 40; rotate = degrees(0);
        } else if (wmPosition === 'bottom-right') {
          x = width - textWidth - 40; y = 40; rotate = degrees(0);
        } else if (wmPosition === 'diagonal') {
          x = width / 4; y = height / 3; rotate = degrees(-45);
        } else {
          x = (width - textWidth) / 2; y = (height - textHeight) / 2; rotate = degrees(-45);
        }

        page.drawText(wmText, {
          x, y, size: wmFontSize, font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: wmOpacity,
          rotate,
        });
      });

      const bytes = await doc.save();
      const fileName = wmFileName.replace('.pdf', '') + '_watermarked.pdf';
      downloadBlob(bytes, fileName);
      toast.success('\u0e43\u0e2a\u0e48\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08!');
    } catch (err) {
      toast.error('\u0e40\u0e01\u0e34\u0e14\u0e02\u0e49\u0e2d\u0e1c\u0e34\u0e14\u0e1e\u0e25\u0e32\u0e14: ' + err.message);
    } finally {
      setWatermarking(false);
    }
  };

  function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  };
  const inputStyle = {
    width: '100%', padding: '12px 16px', background: '#f8f9fa',
    border: '1px solid #e0e0e0', borderRadius: 10, color: CI.dark,
    fontSize: 15, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
  };
  const btnGradient = (from, to) => ({
    padding: '12px 24px', background: `linear-gradient(135deg, ${from}, ${to})`,
    color: '#fff', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: 16,
    cursor: 'pointer', fontWeight: 600, width: '100%',
  });

  const WM_POSITIONS = [
    { key: 'center', label: '\u0e01\u0e25\u0e32\u0e07 (\u0e40\u0e2d\u0e35\u0e22\u0e07)' },
    { key: 'diagonal', label: '\u0e01\u0e25\u0e32\u0e07 (\u0e41\u0e19\u0e27\u0e17\u0e41\u0e22\u0e07)' },
    { key: 'top-left', label: '\u0e1a\u0e19\u0e0b\u0e49\u0e32\u0e22' },
    { key: 'top-right', label: '\u0e1a\u0e19\u0e02\u0e27\u0e32' },
    { key: 'bottom-left', label: '\u0e25\u0e48\u0e32\u0e07\u0e0b\u0e49\u0e32\u0e22' },
    { key: 'bottom-right', label: '\u0e25\u0e48\u0e32\u0e07\u0e02\u0e27\u0e32' },
  ];

  return (
    <div style={{ fontFamily: FONT, color: CI.dark, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>{'\ud83d\udcc4'}</span>
        <h2 style={{ fontSize: 22, margin: 0, background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PDF Toolkit
        </h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12, fontFamily: FONT, fontSize: 16,
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
              background: activeTab === tab.key ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : '#f0f0f0',
              color: activeTab === tab.key ? '#fff' : '#888',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* MERGE TAB */}
      {activeTab === 'merge' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.cyan }}>{'\ud83d\udcc2'} \u0e23\u0e27\u0e21\u0e44\u0e1f\u0e25\u0e4c PDF</h3>
          <p style={{ fontSize: 14, color: '#999', margin: '0 0 16px 0' }}>{'\u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e2b\u0e25\u0e32\u0e22\u0e44\u0e1f\u0e25\u0e4c\u0e41\u0e25\u0e30\u0e25\u0e32\u0e01\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e40\u0e23\u0e35\u0e22\u0e07\u0e25\u0e33\u0e14\u0e31\u0e1a'}</p>

          <input ref={mergeRef} type="file" accept=".pdf" multiple onChange={handleMergeFiles} style={{ display: 'none' }} />
          <button onClick={() => mergeRef.current?.click()} style={{
            padding: '10px 20px', background: '#f8f9fa', border: '2px dashed #ccc', borderRadius: 10,
            fontFamily: FONT, fontSize: 15, cursor: 'pointer', color: '#888', width: '100%', marginBottom: 16,
          }}>
            + \u0e40\u0e1e\u0e34\u0e48\u0e21\u0e44\u0e1f\u0e25\u0e4c PDF
          </button>

          {mergeFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {mergeFiles.map((entry, idx) => (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => setDragOverIdx(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: dragOverIdx === idx ? `${CI.cyan}15` : '#f8f9fa',
                    borderRadius: 8, cursor: 'grab',
                    border: dragOverIdx === idx ? `2px dashed ${CI.cyan}` : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16, color: '#ccc', cursor: 'grab' }}>{'\u2630'}</span>
                  <span style={{ fontSize: 14, color: '#999', minWidth: 24 }}>#{idx + 1}</span>
                  <span style={{ flex: 1, fontSize: 15 }}>{entry.name}</span>
                  <span style={{ fontSize: 13, color: '#bbb' }}>{(entry.file.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => removeMergeFile(entry.id)} style={{ background: 'none', border: 'none', color: CI.magenta, cursor: 'pointer', fontSize: 16 }}>{'\u2715'}</button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={doMerge}
            disabled={merging || mergeFiles.length < 2}
            style={{
              ...btnGradient(CI.cyan, CI.purple),
              opacity: merging || mergeFiles.length < 2 ? 0.5 : 1,
              cursor: merging || mergeFiles.length < 2 ? 'not-allowed' : 'pointer',
            }}
          >
            {merging ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e23\u0e27\u0e21...' : `\ud83d\udcc2 \u0e23\u0e27\u0e21 ${mergeFiles.length} \u0e44\u0e1f\u0e25\u0e4c`}
          </button>
        </div>
      )}

      {/* SPLIT TAB */}
      {activeTab === 'split' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.magenta }}>{'\u2702\ufe0f'} \u0e41\u0e22\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF</h3>

          <input ref={splitRef} type="file" accept=".pdf" onChange={handleSplitFile} style={{ display: 'none' }} />
          <button onClick={() => splitRef.current?.click()} style={{
            padding: '10px 20px', background: '#f8f9fa', border: '2px dashed #ccc', borderRadius: 10,
            fontFamily: FONT, fontSize: 15, cursor: 'pointer', color: '#888', width: '100%', marginBottom: 16,
          }}>
            {splitFileName || '+ \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF'}
          </button>

          {splitPageCount > 0 && (
            <div style={{ padding: '10px 14px', background: `${CI.cyan}10`, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: CI.cyan, fontWeight: 600 }}>{'\u0e44\u0e1f\u0e25\u0e4c\u0e21\u0e35'} {splitPageCount} {'\u0e2b\u0e19\u0e49\u0e32'}</span>
            </div>
          )}

          <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 6 }}>{'\u0e23\u0e30\u0e1a\u0e38\u0e0a\u0e48\u0e27\u0e07\u0e2b\u0e19\u0e49\u0e32 (\u0e04\u0e31\u0e48\u0e19\u0e14\u0e49\u0e27\u0e22\u0e04\u0e2d\u0e21\u0e21\u0e48\u0e32)'}</label>
          <input
            value={splitRanges}
            onChange={e => setSplitRanges(e.target.value)}
            placeholder="\u0e40\u0e0a\u0e48\u0e19 1-3, 5-7, 10"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <button
            onClick={doSplit}
            disabled={splitting || !splitFile}
            style={{
              ...btnGradient(CI.magenta, CI.purple),
              opacity: splitting || !splitFile ? 0.5 : 1,
              cursor: splitting || !splitFile ? 'not-allowed' : 'pointer',
            }}
          >
            {splitting ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e41\u0e22\u0e01...' : '\u2702\ufe0f \u0e41\u0e22\u0e01\u0e44\u0e1f\u0e25\u0e4c'}
          </button>
        </div>
      )}

      {/* WATERMARK TAB */}
      {activeTab === 'watermark' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 17, margin: '0 0 14px 0', color: CI.purple }}>{'\ud83d\udca7'} \u0e43\u0e2a\u0e48\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33</h3>

          <input ref={wmRef} type="file" accept=".pdf" onChange={handleWmFile} style={{ display: 'none' }} />
          <button onClick={() => wmRef.current?.click()} style={{
            padding: '10px 20px', background: '#f8f9fa', border: '2px dashed #ccc', borderRadius: 10,
            fontFamily: FONT, fontSize: 15, cursor: 'pointer', color: '#888', width: '100%', marginBottom: 16,
          }}>
            {wmFileName || '+ \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e44\u0e1f\u0e25\u0e4c PDF'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 6 }}>{'\u0e02\u0e49\u0e2d\u0e04\u0e27\u0e32\u0e21\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33'}</label>
              <input value={wmText} onChange={e => setWmText(e.target.value)} style={inputStyle} placeholder="CONFIDENTIAL" />
            </div>
            <div>
              <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 6 }}>{'\u0e02\u0e19\u0e32\u0e14\u0e15\u0e31\u0e27\u0e2d\u0e31\u0e01\u0e29\u0e23'}</label>
              <input type="number" value={wmFontSize} onChange={e => setWmFontSize(Number(e.target.value))} min={10} max={200} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 6 }}>{'\u0e04\u0e27\u0e32\u0e21\u0e42\u0e1b\u0e23\u0e48\u0e07\u0e43\u0e2a'}: {Math.round(wmOpacity * 100)}%</label>
            <input
              type="range" min={0.05} max={1} step={0.05} value={wmOpacity}
              onChange={e => setWmOpacity(Number(e.target.value))}
              style={{ width: '100%', accentColor: CI.purple }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#888', display: 'block', marginBottom: 8 }}>{'\u0e15\u0e33\u0e41\u0e2b\u0e19\u0e48\u0e07'}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WM_POSITIONS.map(pos => (
                <button
                  key={pos.key}
                  onClick={() => setWmPosition(pos.key)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontFamily: FONT, fontSize: 14,
                    cursor: 'pointer', border: 'none', fontWeight: 500,
                    background: wmPosition === pos.key ? `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})` : '#f0f0f0',
                    color: wmPosition === pos.key ? '#fff' : '#888',
                  }}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={doWatermark}
            disabled={watermarking || !wmFile}
            style={{
              ...btnGradient(CI.purple, CI.magenta),
              opacity: watermarking || !wmFile ? 0.5 : 1,
              cursor: watermarking || !wmFile ? 'not-allowed' : 'pointer',
            }}
          >
            {watermarking ? '\u23f3 \u0e01\u0e33\u0e25\u0e31\u0e07\u0e43\u0e2a\u0e48\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33...' : '\ud83d\udca7 \u0e43\u0e2a\u0e48\u0e25\u0e32\u0e22\u0e19\u0e49\u0e33\u0e41\u0e25\u0e30\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14'}
          </button>
        </div>
      )}
    </div>
  );
}
