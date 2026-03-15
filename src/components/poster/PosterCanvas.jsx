'use client';
import { useMemo } from 'react';

export default function PosterCanvas({ formData, template, style, preset, bgImage, showDebug, overlayStrength = 40, fontFamily }) {
  const blocks = template?.blocks || {};
  const gradient = style?.gradient || 'linear-gradient(135deg, #0F2027, #2C5364)';
  const accent = style?.accent || '#00ADEF';

  const canvasW = preset?.w || 1200;
  const canvasH = preset?.h || 1200;
  const aspectRatio = `${canvasW} / ${canvasH}`;
  const overlayAlpha = overlayStrength / 100;

  const textFields = useMemo(() => {
    const fields = [];
    if (formData.title && blocks.title)
      fields.push({ key: 'title', text: formData.title, ...blocks.title });
    if (formData.subtitle && blocks.subtitle)
      fields.push({ key: 'subtitle', text: formData.subtitle, ...blocks.subtitle });
    if (formData.speaker && blocks.speaker)
      fields.push({ key: 'speaker', text: `👤 ${formData.speaker}`, ...blocks.speaker });

    const infoParts = [
      formData.date && `📅 ${formData.date}`,
      formData.time && `⏰ ${formData.time}`,
      formData.location && `📍 ${formData.location}`,
    ].filter(Boolean);
    if (infoParts.length > 0 && blocks.info)
      fields.push({ key: 'info', text: infoParts.join('  ·  '), ...blocks.info });

    if (formData.cta && blocks.cta)
      fields.push({ key: 'cta', text: formData.cta, ...blocks.cta, isCta: true });

    return fields;
  }, [formData, blocks]);

  return (
    <div
      id="poster-canvas"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        borderRadius: '12px',
        overflow: 'hidden',
        background: bgImage ? '#000' : gradient,
        fontFamily: fontFamily || "'Inter', 'Noto Sans Thai', sans-serif",
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Background Image */}
      {bgImage && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }} />
      )}

      {/* Smart Gradient Overlay — adapts to photo vs gradient */}
      {bgImage ? (
        <>
          {/* Bottom-heavy gradient for text readability on photos */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg,
              rgba(0,0,0,${overlayAlpha * 0.3}) 0%,
              rgba(0,0,0,${overlayAlpha * 0.1}) 30%,
              rgba(0,0,0,${overlayAlpha * 0.5}) 60%,
              rgba(0,0,0,${overlayAlpha * 0.85}) 100%)`,
            zIndex: 2,
          }} />
          {/* Top gradient for upper text */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(0deg,
              transparent 50%,
              rgba(0,0,0,${overlayAlpha * 0.4}) 100%)`,
            zIndex: 2,
          }} />
        </>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.15)',
          zIndex: 2,
        }} />
      )}

      {/* Decorative accent bar — top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '5px',
        background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)`,
        zIndex: 5,
      }} />

      {/* SPU Logo — top right (when branding enabled) */}
      {formData.showBranding !== false && (
        <div style={{
          position: 'absolute',
          top: '4%', right: '4%',
          zIndex: 15,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <img
            src="/spu-bus-logo.png"
            alt="SPU BUS"
            style={{
              height: 'clamp(28px, 5vw, 48px)',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
            }}
          />
        </div>
      )}

      {/* Text Blocks */}
      {textFields.map((field) => (
        <div
          key={field.key}
          style={{
            position: 'absolute',
            left: field.x,
            top: field.y,
            width: field.w,
            textAlign: field.align || 'left',
            zIndex: 10,
            padding: '4px 0',
            ...(showDebug ? {
              outline: '1px dashed rgba(255,100,100,0.5)',
              background: 'rgba(255,0,0,0.08)',
            } : {}),
          }}
        >
          {field.isCta ? (
            <span style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: accent,
              color: '#ffffff',
              borderRadius: '100px',
              fontSize: `clamp(${field.minFont}px, 2vw, ${field.maxFont}px)`,
              fontWeight: field.weight || 700,
              letterSpacing: '0.02em',
              boxShadow: `0 4px 20px ${accent}66`,
              textShadow: 'none',
            }}>
              {field.text}
            </span>
          ) : (
            <div style={{
              color: '#ffffff',
              fontSize: `clamp(${field.minFont}px, 2.5vw, ${field.maxFont}px)`,
              fontWeight: field.weight || 400,
              lineHeight: field.key === 'title' ? 1.15 : 1.4,
              letterSpacing: field.key === 'title' ? '-0.02em' : '0em',
              textShadow: bgImage
                ? '0 2px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)'
                : '0 2px 8px rgba(0,0,0,0.4)',
              wordBreak: 'break-word',
              ...(field.key === 'title' ? {
                // Title gets a subtle background pill for readability
                ...(bgImage ? {
                  background: 'rgba(0,0,0,0.25)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(4px)',
                  display: 'inline-block',
                } : {}),
              } : {}),
            }}>
              {field.text}
            </div>
          )}
        </div>
      ))}

      {/* Date badge — bottom right corner */}
      {formData.date && (
        <div style={{
          position: 'absolute',
          bottom: '8%', right: '5%',
          zIndex: 12,
          background: accent,
          color: '#ffffff',
          padding: '14px 18px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: `0 6px 24px ${accent}55`,
          lineHeight: 1.2,
        }}>
          <div style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900 }}>
            {formData.date.match(/\d+/)?.[0] || ''}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.5vw, 15px)', fontWeight: 600, opacity: 0.9 }}>
            {formData.date.replace(/\d+\s*/, '') || formData.date}
          </div>
          {formData.time && (
            <div style={{ fontSize: 'clamp(8px, 1.2vw, 12px)', marginTop: '4px', opacity: 0.8 }}>
              {formData.time}
            </div>
          )}
        </div>
      )}

      {/* Branding footer */}
      {formData.showBranding !== false && (
        <div style={{
          position: 'absolute',
          bottom: '1.5%', left: '4%', right: '4%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          opacity: 0.8,
        }}>
          <span style={{
            fontSize: 'clamp(8px, 1.1vw, 12px)',
            color: '#ffffff',
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}>
            คณะบริหารธุรกิจ มหาวิทยาลัยศรีปทุม
          </span>
          {formData.hashtags && (
            <span style={{
              fontSize: 'clamp(7px, 0.9vw, 10px)',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {formData.hashtags}
            </span>
          )}
        </div>
      )}

      {/* Placeholder text when empty */}
      {!formData.title && !bgImage && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, flexDirection: 'column', gap: '8px',
        }}>
          <span style={{ fontSize: '48px', opacity: 0.3 }}>🎨</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            กรอกข้อความหรืออัปโหลดรูป
          </span>
        </div>
      )}

      {/* Debug: safe area outlines */}
      {showDebug && Object.entries(blocks).map(([key, block]) => (
        <div key={`debug-${key}`} style={{
          position: 'absolute',
          left: block.x, top: block.y,
          width: block.w, height: '30px',
          border: '1px dashed rgba(0,255,0,0.4)',
          zIndex: 20, pointerEvents: 'none',
          fontSize: '9px', color: 'rgba(0,255,0,0.6)',
          padding: '2px 4px',
        }}>
          {key}
        </div>
      ))}
    </div>
  );
}
