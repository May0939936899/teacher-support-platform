import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// Setup endpoint — creates live_quiz_rooms table via Supabase RPC
export async function POST() {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 });
    }

    // Create table via REST API (raw SQL via rpc)
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS live_quiz_rooms (
          id TEXT PRIMARY KEY,
          quiz JSONB NOT NULL DEFAULT '{}',
          players JSONB NOT NULL DEFAULT '[]',
          game_state TEXT NOT NULL DEFAULT 'lobby',
          current_q INTEGER NOT NULL DEFAULT 0,
          responses JSONB NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now(),
          expires_at TIMESTAMPTZ
        );
      `
    });

    if (error) {
      // Table might already exist — that's fine
      console.warn('Setup warning:', error.message);
    }

    return NextResponse.json({ ok: true, message: 'Setup complete' });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
