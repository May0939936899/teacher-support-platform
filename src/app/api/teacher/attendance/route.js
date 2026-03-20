import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ============================================================
// Attendance API — Hybrid: Supabase (if table exists) + In-Memory fallback
// ============================================================

const memoryStore = globalThis.__attendanceSessions || (globalThis.__attendanceSessions = new Map());

let supabaseAvailable = null;

async function checkSupabase() {
  if (supabaseAvailable !== null) return supabaseAvailable;
  try {
    const supabase = createAdminClient();
    if (!supabase) { supabaseAvailable = false; return false; }
    const { error } = await supabase.from('attendance_sessions').select('id').limit(1);
    supabaseAvailable = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

async function getSession(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data } = await supabase.from('attendance_sessions').select('*').eq('id', code).single();
    return data || null;
  }
  return memoryStore.get(code) || null;
}

async function saveSession(session) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('attendance_sessions').upsert(session).select().single();
    if (error) throw error;
    return data;
  }
  memoryStore.set(session.id, { ...session });
  return session;
}

async function updateSession(code, updates) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('attendance_sessions').update(updates).eq('id', code).select().single();
    if (error) throw error;
    return data;
  }
  const session = memoryStore.get(code);
  if (!session) return null;
  const updated = { ...session, ...updates };
  memoryStore.set(code, updated);
  return updated;
}

async function deleteSession(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    await supabase.from('attendance_sessions').delete().eq('id', code);
  }
  memoryStore.delete(code);
}

async function listSessions() {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    const supabase = createAdminClient();
    const { data } = await supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false }).limit(50);
    return data || [];
  }
  return Array.from(memoryStore.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

// GET — fetch session by code OR list all sessions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');

    if (action === 'list') {
      const sessions = await listSessions();
      return NextResponse.json({ sessions });
    }

    if (!code) return NextResponse.json({ error: 'Missing session code' }, { status: 400 });

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error('Attendance GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create new session
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.courseName) {
      return NextResponse.json({ error: 'Missing course name' }, { status: 400 });
    }

    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const now = Date.now();
    const session = {
      id: code,
      course_name: body.courseName,
      section: body.section || '',
      topic: body.topic || '',
      use_location: body.useLocation ?? true,
      location_name: body.locationName || '',
      location_lat: body.locationLat || null,
      location_lng: body.locationLng || null,
      location_radius: body.locationRadius || 200,
      duration_min: body.durationMin || 90,
      active: true,
      records: [],
      created_at: now,
      expires_at: now + (body.durationMin || 90) * 60000,
    };

    const saved = await saveSession(session);
    const useSupabase = await checkSupabase();
    return NextResponse.json({ session: saved, code, storage: useSupabase ? 'supabase' : 'memory' });
  } catch (err) {
    console.error('Attendance POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — close session
export async function PUT(request) {
  try {
    const { code, action } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    if (action === 'close') {
      const session = await updateSession(code.toUpperCase(), { active: false });
      if (!session) return NextResponse.json({ error: 'ไม่พบ Session' }, { status: 404 });
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Attendance PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — student check-in
export async function PATCH(request) {
  try {
    const { code, name, studentId, deviceId, gps } = await request.json();
    if (!code || !name) return NextResponse.json({ error: 'กรุณากรอกรหัสและชื่อ' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const session = await getSession(upperCode);
    if (!session) return NextResponse.json({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    if (!session.active || Date.now() > session.expires_at) {
      return NextResponse.json({ error: 'Session หมดเวลาแล้ว' }, { status: 400 });
    }

    // Check duplicate
    const records = session.records || [];
    const alreadyChecked = records.some(r => r.deviceId === deviceId || (studentId && r.studentId === studentId));
    if (alreadyChecked) return NextResponse.json({ error: 'เช็กชื่อไปแล้ว' }, { status: 400 });

    // Calculate distance
    let distance = null;
    let withinRange = true;
    if (session.location_lat && session.location_lng && gps?.lat && gps?.lng) {
      const R = 6371000;
      const dLat = (gps.lat - session.location_lat) * Math.PI / 180;
      const dLng = (gps.lng - session.location_lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(session.location_lat * Math.PI / 180) * Math.cos(gps.lat * Math.PI / 180) * Math.sin(dLng/2)**2;
      distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      withinRange = distance <= (session.location_radius || 200);
    }

    const record = {
      id: Date.now().toString(),
      name,
      studentId: studentId || '',
      deviceId: deviceId || '',
      checkedAt: Date.now(),
      gps: gps || null,
      address: gps?.address || null,
      distance,
      withinRange,
    };

    const updatedRecords = [...records, record];
    const updated = await updateSession(upperCode, { records: updatedRecords });

    return NextResponse.json({ session: updated, record, withinRange, distance });
  } catch (err) {
    console.error('Attendance PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — delete session(s)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');

    if (action === 'all') {
      // Delete all sessions
      const sessions = await listSessions();
      for (const s of sessions) {
        await deleteSession(s.id);
      }
      return NextResponse.json({ ok: true, deleted: sessions.length });
    }

    if (code) {
      await deleteSession(code.toUpperCase());
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  } catch (err) {
    console.error('Attendance DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
