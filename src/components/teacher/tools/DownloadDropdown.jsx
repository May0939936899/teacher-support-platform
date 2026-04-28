'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const CI = { cyan: '#00b4e6', purple: '#7c4dff' };
const FONT = "'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

export default function DownloadDropdown({ options = [], label = 'ดาวน์โหลด', disabled = false, style = {}, btnStyle = {} }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // คำนวณตำแหน่งของ dropdown จาก button — ป้องกันเกินขอบจอทุกทิศ
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = 240;
    const menuH = 60 + options.length * 48; // header + rows

    // เปิดขึ้นหรือลง
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuH && rect.top > menuH;
    const top = openUp
      ? rect.top + window.scrollY - menuH - 4
      : rect.bottom + window.scrollY + 4;

    // ชิดขวาหรือซ้าย
    let left = rect.left + window.scrollX;
    if (left + menuW > window.innerWidth - 8) {
      left = rect.right + window.scrollX - menuW; // ชิดขวาปุ่ม
    }
    left = Math.max(8, left); // ไม่ให้เกินขอบซ้าย

    setMenuPos({ top, left, width: menuW });
  }, [options.length]);

  const handleOpen = () => {
    if (disabled) return;
    calcPos();
    setOpen(v => !v);
  };

  // ปิดเมื่อคลิกข้างนอก
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        padding: '8px',
        zIndex: 99999,
        fontFamily: FONT,
      }}
    >
      <div style={{ padding: '6px 12px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>เลือกรูปแบบไฟล์</span>
      </div>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => { setOpen(false); opt.onClick(); }}
          style={{
            width: '100%', padding: '11px 14px', border: 'none',
            background: 'transparent', borderRadius: '10px',
            cursor: 'pointer', textAlign: 'left',
            fontSize: '14px', fontWeight: 600, color: '#374151',
            fontFamily: FONT,
            display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{opt.icon}</span>
          <span style={{ flex: 1 }}>{opt.label}</span>
          <span style={{
            fontSize: '11px', fontWeight: 700, color: '#fff',
            background: opt.color || '#94a3b8',
            padding: '2px 8px', borderRadius: '6px',
          }}>{opt.ext}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ display: 'inline-block', ...style }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={disabled}
        style={{
          padding: '10px 20px', borderRadius: '12px', border: 'none',
          background: disabled ? '#e2e8f0' : `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
          color: disabled ? '#94a3b8' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '15px', fontWeight: 700, fontFamily: FONT,
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: disabled ? 'none' : `0 4px 12px ${CI.cyan}30`,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
          ...btnStyle,
        }}
      >
        📥 {label} <span style={{ fontSize: '11px', opacity: 0.8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Portal — render ออกนอก DOM tree เพื่อหลีกเลี่ยง overflow:hidden */}
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </div>
  );
}
