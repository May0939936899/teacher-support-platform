// API Route: Saved Contents / Memory Box (GET, POST, DELETE /api/saved-contents)
import { NextResponse } from 'next/server';
import { getUserFromRequest, createAdminClient } from '@/lib/supabase-server';

function getSupabaseOrError() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { error: NextResponse.json(
      { error: 'Database not configured. Please set SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    )};
  }
  return { supabase };
}

// GET — fetch user's saved contents
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { supabase, error } = getSupabaseOrError();
    if (error) return error;

    const { data, error: dbError } = await supabase
      .from('saved_contents')
      .select('*')
      .eq('user_id', user.id)
      .order('slot_index', { ascending: true });

    if (dbError) throw dbError;

    // Convert to array of 3 slots (null if empty)
    const slots = [null, null, null];
    data?.forEach(item => {
      slots[item.slot_index] = item;
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Saved contents GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — save content to a slot
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slotIndex, contentText, imageUrl, platform, category } = await request.json();
    if (slotIndex === undefined || slotIndex < 0 || slotIndex > 2) {
      return NextResponse.json({ error: 'Invalid slot index (0-2)' }, { status: 400 });
    }

    const { supabase, error } = getSupabaseOrError();
    if (error) return error;

    // Upsert: insert or update on conflict (user_id, slot_index)
    const { data, error: dbError } = await supabase
      .from('saved_contents')
      .upsert({
        user_id: user.id,
        slot_index: slotIndex,
        content_text: contentText || null,
        image_url: imageUrl || null,
        platform: platform || null,
        category: category || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,slot_index',
      })
      .select()
      .single();

    if (dbError) throw dbError;
    return NextResponse.json({ saved: data });
  } catch (error) {
    console.error('Saved contents POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — clear a slot
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slotIndex = parseInt(searchParams.get('slot'));

    if (isNaN(slotIndex) || slotIndex < 0 || slotIndex > 2) {
      return NextResponse.json({ error: 'Invalid slot index' }, { status: 400 });
    }

    const { supabase, error } = getSupabaseOrError();
    if (error) return error;

    const { error: dbError } = await supabase
      .from('saved_contents')
      .delete()
      .eq('user_id', user.id)
      .eq('slot_index', slotIndex);

    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Saved contents DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
