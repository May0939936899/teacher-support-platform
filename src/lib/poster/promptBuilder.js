// ===================================================
// AI Background Prompt Builder for Poster Generator
// ===================================================

import { DESIGN_TYPES, VISUAL_STYLES } from './presets.js';

export function buildPosterImagePrompt(formData, style) {
  const designType = DESIGN_TYPES.find(d => d.id === formData.designType);
  const visualStyle = VISUAL_STYLES.find(v => v.id === formData.visualStyle);

  const contextParts = [
    formData.title && `Topic: ${formData.title}`,
    formData.subtitle && `Subtitle: ${formData.subtitle}`,
    formData.context && `Context: ${formData.context}`,
  ].filter(Boolean).join('. ');

  return `Create a professional background image for a university business school poster.
Theme: ${designType?.promptHint || 'professional event'}
Visual style: ${visualStyle?.promptMod || 'modern business'}
Content context: ${contextParts || 'business education event'}

Requirements:
- Leave clean visual space for text overlay (avoid placing faces or critical objects in text zones)
- Use sophisticated color palette matching the theme
- Make it suitable for ${formData.platform || 'social media'}
- High quality, professional photography or abstract art style
- Do NOT include any text, words, letters, or numbers in the image
- The image should be atmospheric and support readability of overlaid white text`;
}

export function buildVisualContextSummary(formData) {
  return [
    formData.title,
    formData.subtitle,
    formData.speaker && `วิทยากร: ${formData.speaker}`,
    formData.designType,
  ].filter(Boolean).join(' | ');
}
