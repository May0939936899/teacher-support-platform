// API Route: Image OCR / Extraction (POST /api/extract)
// Server-side Gemini Vision call
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/lib/supabase-server';
import { buildImageExtractionPrompt } from '@/lib/prompts';

export const maxDuration = 30; // Allow up to 30s for image processing

export async function POST(request) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    // 3. Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // 4. Call Gemini Vision
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const prompt = buildImageExtractionPrompt();
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'AI ไม่สามารถสกัดข้อความจากภาพนี้ได้' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text });

  } catch (error) {
    console.error('Extract API error:', error);
    const message = error.message || 'Internal server error';
    const status = message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
