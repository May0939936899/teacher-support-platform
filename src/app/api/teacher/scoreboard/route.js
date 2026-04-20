import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ── In-memory store (fallback when Supabase table not ready) ──
const memStore = globalThis.__scoreboardSessions || (globalThis.__scoreboardSessions = new Map());
let supabaseOk = null;

async function checkSupabase() {
  if (supabaseOk !== null) return supabaseOk;
  try {
    const sb = createAdminClient();
    if (!sb) { supabaseOk = false; return false; }
    const { error } = await sb.from('scoreboard_sessions').select('id').limit(1);
    supabaseOk = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return supabaseOk;
  } catch { supabaseOk = false; return false; }
}

async function getSession(code) {
  if (await checkSupabase()) {
    const sb = createAdminClient();
    const { data } = await sb.from('scoreboard_sessions').select('*').eq('id', code).single();
    return data || null;
  }
  return memStore.get(code) || null;
}

async function saveSession(session) {
  if (await checkSupabase()) {
    const sb = createAdminClient();
    const { data, error } = await sb.from('scoreboard_sessions').upsert(session).select().single();
    if (error) throw error;
    return data;
  }
  memStore.set(session.id, { ...session });
  return session;
}

async function updateSession(code, updates) {
  if (await checkSupabase()) {
    const sb = createAdminClient();
    const { data, error } = await sb.from('scoreboard_sessions').update(updates).eq('id', code).select().single();
    if (error) throw error;
    return data;
  }
  const s = memStore.get(code);
  if (!s) return null;
  const updated = { ...s, ...updates };
  memStore.set(code, updated);
  return updated;
}

async function deleteSession(code) {
  if (await checkSupabase()) {
    const sb = createAdminClient();
    await sb.from('scoreboard_sessions').delete().eq('id', code);
  }
  memStore.delete(code);
}

// GET — fetch session by code (student polling)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const session = await getSession(code.toUpperCase());
    if (!session) return NextResponse.json({ error: 'ไม่พบ session หรือหมดเวลาแล้ว' }, { status: 404 });
    if (!session.active) return NextResponse.json({ error: 'Session ถูกปิดแล้ว' }, { status: 400 });
    if (Date.now() > session.expires_at) return NextResponse.json({ error: 'Session หมดเวลาแล้ว' }, { status: 400 });

    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — teacher creates session
export async function POST(request) {
  try {
    const { teams } = await request.json();
    if (!teams?.length) return NextResponse.json({ error: 'Missing teams' }, { status: 400 });

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session = {
      id: code,
      teams,
      active: true,
      created_at: Date.now(),
      expires_at: Date.now() + 6 * 60 * 60 * 1000, // 6 hours
    };
    const saved = await saveSession(session);
    return NextResponse.json({ session: saved, code });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — teacher syncs teams (scores + names)
export async function PUT(request) {
  try {
    const { code, teams } = await request.json();
    if (!code || !teams) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    const session = await updateSession(code.toUpperCase(), { teams });
    if (!session) return NextResponse.json({ error: 'ไม่พบ session' }, { status: 404 });
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — student renames a team (name only, no score)
export async function PATCH(request) {
  try {
    const { code, teamId, name } = await request.json();
    if (!code || !teamId || !name?.trim()) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const session = await getSession(upperCode);
    if (!session || !session.active) return NextResponse.json({ error: 'Session ไม่พร้อมใช้งาน' }, { status: 400 });

    const updatedTeams = session.teams.map(t =>
      t.id === teamId ? { ...t, name: name.trim().slice(0, 30) } : t
    );
    const updated = await updateSession(upperCode, { teams: updatedTeams });
    return NextResponse.json({ session: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — teacher closes session
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    await deleteSession(code.toUpperCase());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
