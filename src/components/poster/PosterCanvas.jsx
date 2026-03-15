'use client';
import { useMemo } from 'react';

export default function PosterCanvas({ formData, template, style, preset, bgImage, showDebug }) {
  const blocks = template?.blocks || {};
  const gradient = style?.gradient || 'linear-gradient(135deg, #0F2027, #2C5364)';
  const accent = style?.accent || '#00ADEF';
  const overlay = style?.overlay || 'rgba(0,0,0,0.35)';

  const canvasW = preset?.w || 1200;
  const canvasH = preset?.h || 1200;
  const aspectRatio = `${canvasW} / ${canvasH}`;

  const textFields = useMemo(() => {
    const fields = [];
    if (formData.title && blocks.title)
      fields.push({ key: 'title', text: formData.title, ...blocks.title });
    if (formData.subtitle && blocks.subtitle)
      fields.push({ key: 'subtitle', text: formData.subtitle, ...blocks.subtitle });
    if (formData.speaker && blocks.speaker)
      fields.push({ key: 'speaker', text: `👤 ${formData.speaker}`, ...blocks.speaker });

    // Info block — combine date/time/location
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
        background: gradient,
        fontFamily: "'Inter', 'Noto Sans Thai', sans-serif",
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

      {/* Gradient Overlay for text readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: overlay,
        zIndex: 2,
      }} />

      {/* Decorative accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${accent}, transparent)`,
        zIndex: 5,
      }} />

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
              padding: '10px 28px',
              background: accent,
              color: '#ffffff',
              borderRadius: '100px',
              fontSize: `clamp(${field.minFont}px, 2vw, ${field.maxFont}px)`,
              fontWeight: field.weight || 700,
              letterSpacing: '0.02em',
              boxShadow: `0 4px 20px ${accent}66`,
            }}>
              {field.text}
            </span>
          ) : (
            <div style={{
              color: '#ffffff',
              fontSize: `clamp(${field.minFont}px, 2.5vw, ${field.maxFont}px)`,
              fontWeight: field.weight || 400,
              lineHeight: 1.35,
              letterSpacing: field.weight >= 700 ? '-0.02em' : '0em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              wordBreak: 'break-word',
              ...(field.key === 'title' ? {
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
              } : {}),
            }}>
              {field.text}
            </div>
          )}
        </div>
      ))}

      {/* Optional branding footer */}
      {formData.showBranding !== false && (
        <div style={{
          position: 'absolute',
          bottom: '3%', left: '5%', right: '5%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          opacity: 0.7,
        }}>
          <span style={{
            fontSize: 'clamp(9px, 1.2vw, 13px)',
            color: '#ffffff',
            fontWeight: 500,
          }}>
            คณะบริหารธุรกิจ ม.ศรีปทุม
          </span>
          {formData.hashtags && (
            <span style={{
              fontSize: 'clamp(8px, 1vw, 11px)',
              color: 'rgba(255,255,255,0.6)',
            }}>
              {formData.hashtags}
            </span>
          )}
        </div>
      )}

      {/* Debug: safe area outlines */}
      {showDebug && Object.entries(blocks).map(([key, block]) => (
        <div key={`debug-${key}`} style={{
          position: 'absolute',
          left: block.x, top: block.y,
          width: block.w,
          height: '30px',
          border: '1px dashed rgba(0,255,0,0.4)',
          zIndex: 20,
          pointerEvents: 'none',
          fontSize: '9px',
          color: 'rgba(0,255,0,0.6)',
          padding: '2px 4px',
        }}>
          {key}
        </div>
      ))}
    </div>
  );
}
