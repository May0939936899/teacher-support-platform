import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Setup endpoint — creates live_quiz_rooms table if it doesn't exist
// Uses direct PostgreSQL connection via pg library
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }

    // Extract project ref from URL
    const ref = supabaseUrl.replace('https://', '').split('.')[0];
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;

    if (!dbPassword) {
      // Fallback: try using service role key approach with direct SQL via REST
      return NextResponse.json({
        error: 'SUPABASE_DB_PASSWORD not set. Please add it to .env.local',
        hint: 'Go to Supabase Dashboard → Settings → Database → Connection string → Copy password',
      }, { status: 500 });
    }

    const pool = new Pool({
      connectionString: `postgresql://postgres.${ref}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    try {
      await client.query(`
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
      `);

      // Enable RLS
      await client.query(`ALTER TABLE live_quiz_rooms ENABLE ROW LEVEL SECURITY;`);

      // Create policy (ignore error if already exists)
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'live_quiz_rooms' AND policyname = 'Allow all for live_quiz_rooms'
          ) THEN
            CREATE POLICY "Allow all for live_quiz_rooms" ON live_quiz_rooms FOR ALL USING (true) WITH CHECK (true);
          END IF;
        END $$;
      `);

      return NextResponse.json({ ok: true, message: 'Table created successfully' });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
