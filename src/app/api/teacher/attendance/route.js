import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ============================================================
// Attendance API — Hybrid: Supabase (if table exists) + In-Memory fallback
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonRes(data, statusOrObj = 200) {
  const status = typeof statusOrObj === 'number' ? statusOrObj : (statusOrObj?.status || 200);
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const memoryStore = globalThis.__attendanceSessions || (globalThis.__attendanceSessions = new Map());

let supabaseAvailable = null;
let supabaseCheckedAt = 0;

async function checkSupabase() {
  // Re-check every 60 seconds in case table was created
  if (supabaseAvailable !== null && Date.now() - supabaseCheckedAt < 60000) return supabaseAvailable;
  try {
    const supabase = createAdminClient();
    if (!supabase) { supabaseAvailable = false; supabaseCheckedAt = Date.now(); return false; }
    const { error } = await supabase.from('attendance_sessions').select('id').limit(1);
    supabaseAvailable = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    supabaseCheckedAt = Date.now();
    console.log('[Attendance] Supabase check:', supabaseAvailable ? 'AVAILABLE' : 'NOT AVAILABLE', error?.message || '');
    return supabaseAvailable;
  } catch (e) {
    console.error('[Attendance] Supabase check error:', e.message);
    supabaseAvailable = false;
    supabaseCheckedAt = Date.now();
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
      return jsonRes({ sessions });
    }

    if (!code) return jsonRes({ error: 'Missing session code' }, { status: 400 });

    const session = await getSession(code.toUpperCase());
    if (!session) {
      return jsonRes({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    }

    return jsonRes({ session });
  } catch (err) {
    console.error('Attendance GET error:', err);
    return jsonRes({ error: err.message }, { status: 500 });
  }
}

// POST — create new session
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.courseName) {
      return jsonRes({ error: 'Missing course name' }, { status: 400 });
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
    return jsonRes({ session: saved, code, storage: useSupabase ? 'supabase' : 'memory' });
  } catch (err) {
    console.error('Attendance POST error:', err);
    return jsonRes({ error: err.message }, { status: 500 });
  }
}

// PUT — close session
export async function PUT(request) {
  try {
    const { code, action } = await request.json();
    if (!code) return jsonRes({ error: 'Missing code' }, { status: 400 });

    if (action === 'close') {
      const session = await updateSession(code.toUpperCase(), { active: false });
      if (!session) return jsonRes({ error: 'ไม่พบ Session' }, { status: 404 });
      return jsonRes({ session });
    }

    return jsonRes({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Attendance PUT error:', err);
    return jsonRes({ error: err.message }, { status: 500 });
  }
}

// PATCH — student check-in
export async function PATCH(request) {
  try {
    let body;
    try { body = await request.json(); } catch { return jsonRes({ error: 'Invalid request body' }, { status: 400 }); }
    const { code, name, studentId, deviceId, gps } = body;
    console.log('[Attendance PATCH] code:', code, 'name:', name, 'studentId:', studentId);
    if (!code || !name) return jsonRes({ error: 'กรุณากรอกรหัสและชื่อ' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const session = await getSession(upperCode);
    if (!session) return jsonRes({ error: 'ไม่พบ Session หรือหมดเวลาแล้ว' }, { status: 404 });
    if (!session.active || Date.now() > session.expires_at) {
      return jsonRes({ error: 'Session หมดเวลาแล้ว' }, { status: 400 });
    }

    // Check duplicate
    const records = session.records || [];
    const alreadyChecked = records.some(r => r.deviceId === deviceId || (studentId && r.studentId === studentId));
    if (alreadyChecked) return jsonRes({ error: 'เช็กชื่อไปแล้ว' }, { status: 400 });

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

    return jsonRes({ session: updated, record, withinRange, distance });
  } catch (err) {
    console.error('Attendance PATCH error:', err);
    return jsonRes({ error: err.message }, { status: 500 });
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
      return jsonRes({ ok: true, deleted: sessions.length });
    }

    if (code) {
      await deleteSession(code.toUpperCase());
      return jsonRes({ ok: true });
    }

    return jsonRes({ error: 'Missing code' }, { status: 400 });
  } catch (err) {
    console.error('Attendance DELETE error:', err);
    return jsonRes({ error: err.message }, { status: 500 });
  }
}
