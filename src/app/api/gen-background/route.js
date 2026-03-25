// API Route: AI Background Image Suggestions (POST /api/gen-background)
// 1. Uses Gemini to extract English keywords from Thai title + context
// 2. Fetches relevant stock photos via Pexels API (or curated fallback)
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/lib/supabase-server';

// Curated Unsplash photo sets by design type (direct CDN URLs — no API key needed)
const CURATED = {
  event: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&q=80',
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1280&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1280&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280&q=80',
    'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=1280&q=80',
  ],
  workshop: [
    'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=1280&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1280&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1280&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&q=80',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1280&q=80',
    'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=1280&q=80',
  ],
  course: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1280&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&q=80',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1280&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1280&q=80',
    'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1280&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1280&q=80',
  ],
  speaker: [
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1280&q=80',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1280&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1280&q=80',
    'https://images.unsplash.com/photo-1560439514-4e9645039924?w=1280&q=80',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1280&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1280&q=80',
  ],
  openhouse: [
    'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1280&q=80',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=1280&q=80',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1280&q=80',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1280&q=80',
    'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1280&q=80',
    'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=1280&q=80',
  ],
  recruitment: [
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1280&q=80',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1280&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1280&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1280&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1280&q=80',
    'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1280&q=80',
  ],
  seminar: [
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1280&q=80',
    'https://images.unsplash.com/photo-1558403194-611308249627?w=1280&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1280&q=80',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1280&q=80',
    'https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=1280&q=80',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1280&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1280&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1280&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1280&q=80',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1280&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1280&q=80',
  ],
};

async function getKeywordsFromGemini(title, designType, visualStyle, context) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  const prompt = `You are an image search expert. Translate this Thai poster title into 4-5 short English keywords for finding a professional background photo.

Title: "${title}"
Type: ${designType || 'event'}
Style: ${visualStyle || 'professional'}
Context: ${context || ''}

Return ONLY a comma-separated list of 4-5 English keyword phrases (1-3 words each). No explanation. No numbering.
Focus on visual atmosphere, not literal content.
Example: modern conference, blue light bokeh, business stage, professional event`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  return text
    .split(',')
    .map(k => k.replace(/[^a-zA-Z0-9 '-]/g, '').trim())
    .filter(k => k.length > 1)
    .slice(0, 5);
}

async function fetchPexelsImages(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.photos || []).map(p => p.src.large2x || p.src.large);
}

export async function POST(request) {
  try {
    // Auth
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, designType, visualStyle, context } = await request.json();
    if (!title?.trim()) {
      return NextResponse.json({ error: 'กรุณาใส่หัวข้อโปสเตอร์ก่อน' }, { status: 400 });
    }

    // Step 1: Generate keywords with Gemini
    let keywords = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        keywords = await getKeywordsFromGemini(title, designType, visualStyle, context);
      } catch (e) {
        console.warn('Gemini keyword error (non-fatal):', e.message);
      }
    }
    // Fallback keywords from design type
    if (keywords.length === 0) {
      const fallbackMap = {
        event: ['event stage', 'conference lights', 'professional gathering'],
        workshop: ['workshop team', 'hands-on learning', 'collaboration'],
        course: ['university education', 'classroom', 'academic'],
        speaker: ['keynote speaker', 'stage spotlight', 'presentation'],
        openhouse: ['university campus', 'open house', 'students'],
        recruitment: ['career success', 'young professionals', 'graduation'],
        seminar: ['business seminar', 'corporate meeting', 'professional'],
        general: ['modern office', 'abstract background', 'professional'],
      };
      keywords = fallbackMap[designType] || fallbackMap.general;
    }

    // Step 2: Try Pexels API first
    let images = null;
    if (process.env.PEXELS_API_KEY) {
      try {
        images = await fetchPexelsImages(keywords.slice(0, 3).join(' '));
      } catch (e) {
        console.warn('Pexels fetch error (non-fatal):', e.message);
      }
    }

    // Step 3: Fallback to curated Unsplash images (no API key needed)
    if (!images || images.length < 4) {
      const pool = CURATED[designType] || CURATED.general;
      // Shuffle for variety each request
      images = [...pool].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      images: images.slice(0, 6),
      keywords,
    });

  } catch (error) {
    console.error('Gen background error:', error);
    // Emergency fallback — never return an error UI
    const fallback = [...(CURATED.general)].sort(() => Math.random() - 0.5);
    return NextResponse.json({ images: fallback.slice(0, 6), keywords: [] });
  }
}
