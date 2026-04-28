'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const CI = { cyan: '#00b4e6', magenta: '#e6007e', dark: '#0b0b24', gold: '#ffc107', purple: '#7c4dff' };
const FONT = "'DB XDMAN X', 'Kanit', 'Noto Sans Thai', -apple-system, sans-serif";

/**
 * AntiCheatGuard — ระบบป้องกันการทุจริตสำหรับข้อสอบ
 *
 * Props:
 * - active: boolean — เปิดใช้งานหรือไม่
 * - onViolation: () => void — callback เมื่อตรวจพบการทุจริต (สลับหน้าจอ)
 * - maxWarnings: number — จำนวนครั้งเตือนก่อนบังคับส่ง (default: 1, ถ้า 0 = บังคับทันที)
 * - children: React.ReactNode
 */
export default function AntiCheatGuard({ active, onViolation, maxWarnings = 1, children }) {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [kicked, setKicked] = useState(false);
  const violationsRef = useRef(0);

  const handleViolation = useCallback(() => {
    if (!active || kicked) return;

    violationsRef.current += 1;
    const count = violationsRef.current;
    setViolations(count);

    if (maxWarnings > 0 && count <= maxWarnings) {
      // Show warning
      setShowWarning(true);
    } else {
      // Kick out
      setKicked(true);
      if (onViolation) onViolation();
    }
  }, [active, kicked, maxWarnings, onViolation]);

  useEffect(() => {
    if (!active) return;

    // Detect tab visibility change
    const handleVisibility = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    // Detect window blur (alt-tab, click outside)
    const handleBlur = () => {
      // Small delay to avoid false triggers from browser UI interactions
      setTimeout(() => {
        if (document.hidden) {
          handleViolation();
        }
      }, 200);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [active, handleViolation]);

  // If kicked out
  if (kicked) {
    return (
      <div style={{
        padding: '40px 24px', maxWidth: '500px', margin: '40px auto', fontFamily: FONT,
        textAlign: 'center',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '48px 32px',
          border: '2px solid #fecaca', boxShadow: '0 8px 32px rgba(239,68,68,0.12)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, color: '#dc2626' }}>
            ถูกตัดสิทธิ์การสอบ
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.7, marginBottom: '24px' }}>
            ตรวจพบการสลับหน้าจอ / ออกจากหน้าข้อสอบ<br/>
            ระบบได้บังคับส่งคำตอบของคุณแล้ว
          </p>
          <div style={{
            background: '#fef2f2', borderRadius: '12px', padding: '16px',
            fontSize: '14px', color: '#991b1b', lineHeight: 1.6,
          }}>
            <strong>⚠️ จำนวนครั้งที่สลับหน้าจอ:</strong> {violations} ครั้ง<br/>
            กรุณาติดต่ออาจารย์หากมีข้อสงสัย
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Anti-cheat notice banner */}
      {active && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fef9c3)',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '16px',
          border: '1px solid #fbbf24',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', color: '#92400e', lineHeight: 1.5,
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</span>
          <div>
            <strong>ระบบป้องกันการทุจริต</strong> — ห้ามสลับแท็บหรือออกจากหน้าข้อสอบ
            {maxWarnings > 0
              ? <span> (เตือน {maxWarnings} ครั้ง หลังจากนั้นบังคับส่งทันที)</span>
              : <span> (บังคับส่งทันทีหากออกจากหน้านี้)</span>
            }
          </div>
        </div>
      )}

      {/* Warning overlay */}
      {showWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT,
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '40px 32px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'shakeIn 0.4s ease-out',
          }}>
            <style>{`
              @keyframes shakeIn {
                0% { transform: scale(0.8) rotate(-2deg); opacity: 0; }
                50% { transform: scale(1.05) rotate(1deg); }
                100% { transform: scale(1) rotate(0deg); opacity: 1; }
              }
            `}</style>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>
              ตรวจพบการสลับหน้าจอ!
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7, marginBottom: '20px' }}>
              คุณได้ออกจากหน้าข้อสอบ ระบบบันทึกไว้แล้ว<br/>
              <strong style={{ color: '#dc2626' }}>
                หากสลับหน้าจออีกครั้ง จะถูกบังคับส่งคำตอบทันที
              </strong>
            </p>
            <div style={{
              background: '#fef2f2', borderRadius: '10px', padding: '12px',
              fontSize: '14px', color: '#991b1b', marginBottom: '20px',
            }}>
              ⚠️ เตือนครั้งที่ {violations} / {maxWarnings}
            </div>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, ${CI.cyan}, ${CI.purple})`,
                color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px',
                fontFamily: 'inherit',
              }}
            >
              กลับไปทำข้อสอบต่อ
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
