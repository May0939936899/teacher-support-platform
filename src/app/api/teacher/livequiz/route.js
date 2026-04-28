import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

// ============================================================
// Live Quiz API — Hybrid: Supabase (if table exists) + In-Memory fallback
// Works immediately without any setup!
// ============================================================

// === In-Memory Store (fallback when Supabase table not ready) ===
const memoryStore = globalThis.__liveQuizRooms || (globalThis.__liveQuizRooms = new Map());

// Track whether Supabase table is available
let supabaseAvailable = null; // null = unchecked, true/false

async function checkSupabase() {
  if (supabaseAvailable !== null) return supabaseAvailable;
  try {
    const supabase = createAdminClient();
    if (!supabase) { supabaseAvailable = false; return false; }
    const { error } = await supabase.from('live_quiz_rooms').select('id').limit(1);
    supabaseAvailable = !error || (error.code !== 'PGRST205' && error.code !== '42P01');
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

// === Supabase helpers ===
async function supabaseGet(code) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('live_quiz_rooms').select('*').eq('id', code).single();
  if (error) return null;
  return data;
}

async function supabaseUpsert(room) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('live_quiz_rooms').upsert(room).select().single();
  if (error) throw error;
  return data;
}

async function supabaseUpdate(code, updates) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('live_quiz_rooms').update(updates).eq('id', code).select().single();
  if (error) throw error;
  return data;
}

async function supabaseDelete(code) {
  const supabase = createAdminClient();
  await supabase.from('live_quiz_rooms').delete().eq('id', code);
}

// === Unified helpers (auto-switch between Supabase and memory) ===
async function getRoom(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    return await supabaseGet(code);
  }
  return memoryStore.get(code) || null;
}

async function saveRoom(room) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    return await supabaseUpsert(room);
  }
  memoryStore.set(room.id, { ...room });
  return room;
}

async function updateRoom(code, updates) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    return await supabaseUpdate(code, updates);
  }
  const room = memoryStore.get(code);
  if (!room) return null;
  const updated = { ...room, ...updates };
  memoryStore.set(code, updated);
  return updated;
}

async function deleteRoom(code) {
  const useSupabase = await checkSupabase();
  if (useSupabase) {
    await supabaseDelete(code);
  }
  memoryStore.delete(code);
}

// GET — fetch room by code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');

    if (action === 'status') {
      const useSupabase = await checkSupabase();
      return NextResponse.json({ storage: useSupabase ? 'supabase' : 'memory', rooms: memoryStore.size });
    }

    if (!code) return NextResponse.json({ error: 'Missing room code' }, { status: 400 });

    const room = await getRoom(code.toUpperCase());
    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้อง กรุณาตรวจสอบ Room Code' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (err) {
    console.error('LiveQuiz GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — create new room
export async function POST(request) {
  try {
    const { quiz, timeLimit } = await request.json();
    if (!quiz || !quiz.title || !quiz.questions?.length) {
      return NextResponse.json({ error: 'Missing quiz data' }, { status: 400 });
    }

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + (timeLimit || 60) * 60000).toISOString();

    const room = {
      id: code,
      quiz,
      players: [],
      game_state: 'lobby',
      current_q: 0,
      responses: [],
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    const saved = await saveRoom(room);
    const useSupabase = await checkSupabase();
    return NextResponse.json({ room: saved, code, storage: useSupabase ? 'supabase' : 'memory' });
  } catch (err) {
    console.error('LiveQuiz POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — update game state (teacher controls)
export async function PUT(request) {
  try {
    const { code, game_state, current_q } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing room code' }, { status: 400 });

    const updates = {};
    if (game_state !== undefined) updates.game_state = game_state;
    if (current_q !== undefined) updates.current_q = current_q;

    const room = await updateRoom(code.toUpperCase(), updates);
    if (!room) return NextResponse.json({ error: 'ไม่พบห้อง' }, { status: 404 });

    return NextResponse.json({ room });
  } catch (err) {
    console.error('LiveQuiz PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — student actions (join / submit answer)
export async function PATCH(request) {
  try {
    const { code, action, player, answer } = await request.json();
    if (!code) return NextResponse.json({ error: 'Missing room code' }, { status: 400 });

    const upperCode = code.toUpperCase();
    const room = await getRoom(upperCode);
    if (!room) return NextResponse.json({ error: 'ไม่พบห้อง' }, { status: 404 });

    if (action === 'join') {
      if (!player?.name) return NextResponse.json({ error: 'กรุณากรอกชื่อ' }, { status: 400 });

      const existingPlayer = (room.players || []).find(p => p.id === player.id);
      let updatedPlayers;
      if (existingPlayer) {
        updatedPlayers = room.players;
      } else {
        updatedPlayers = [...(room.players || []), {
          id: player.id,
          name: player.name,
          avatar: player.avatar || 'knight',
          score: 0,
          joinedAt: Date.now(),
        }];
      }

      const updated = await updateRoom(upperCode, { players: updatedPlayers });
      return NextResponse.json({ room: updated, playerId: player.id });
    }

    if (action === 'answer') {
      if (!answer || answer.questionIndex === undefined) {
        return NextResponse.json({ error: 'Missing answer data' }, { status: 400 });
      }

      const alreadyAnswered = (room.responses || []).find(
        r => r.playerId === answer.playerId && r.questionIndex === answer.questionIndex
      );
      if (alreadyAnswered) return NextResponse.json({ room, message: 'Already answered' });

      const question = room.quiz.questions[answer.questionIndex];
      const isCorrect = question && answer.selected?.toUpperCase() === question.answer?.toUpperCase();
      const points = isCorrect ? (question.points || 10) : 0;

      const newResponse = {
        playerId: answer.playerId,
        playerName: answer.playerName,
        questionIndex: answer.questionIndex,
        selected: answer.selected,
        correct: isCorrect,
        points,
        answeredAt: Date.now(),
      };

      const updatedResponses = [...(room.responses || []), newResponse];
      const updatedPlayers = (room.players || []).map(p =>
        p.id === answer.playerId ? { ...p, score: (p.score || 0) + points } : p
      );

      const updated = await updateRoom(upperCode, {
        responses: updatedResponses,
        players: updatedPlayers,
      });

      return NextResponse.json({ room: updated, correct: isCorrect, points });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('LiveQuiz PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — clean up rooms
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      await deleteRoom(code.toUpperCase());
    } else {
      // Clean up expired rooms from memory
      const now = Date.now();
      for (const [key, room] of memoryStore.entries()) {
        if (room.expires_at && new Date(room.expires_at).getTime() < now) {
          memoryStore.delete(key);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('LiveQuiz DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
