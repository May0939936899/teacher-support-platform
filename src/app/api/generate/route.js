// API Route: Content Generation (POST /api/generate)
// Server-side Gemini API call — API key never exposed to client
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest, createAdminClient } from '@/lib/supabase-server';
import { buildContentPrompt } from '@/lib/prompts';

export async function POST(request) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const { title, category, platform, tone, keyPoints } = await request.json();
    if (!title || !category || !platform || !tone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // 4. Build prompt and call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = buildContentPrompt({ title, category, platform, tone, keyPoints });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'AI did not generate content' }, { status: 500 });
    }

    // 5. Log usage to database (fail-safe — won't block content delivery)
    try {
      const supabase = createAdminClient();
      if (supabase) {
        await supabase.from('generation_logs').insert({
          user_id: user.id,
          platform,
          category,
          tone,
          title,
          used_image: false,
          used_ocr: false,
        });
      }
    } catch (logErr) {
      console.warn('Usage logging failed (non-blocking):', logErr.message);
    }

    // 6. Return generated content
    return NextResponse.json({ content: text });

  } catch (error) {
    console.error('Generate API error:', error);
    const message = error.message || 'Internal server error';
    const status = message.includes('429') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
