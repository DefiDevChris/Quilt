import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: object) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: object) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, thumbnail_url, canvas_json, width_in, height_in, fabric_ids } = body;

  if (!name) return NextResponse.json({ error: '"name" is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_templates')
    .insert({
      user_id: user.id,
      name,
      thumbnail_url: thumbnail_url ?? null,
      canvas_json: canvas_json ?? null,
      width_in: width_in ?? null,
      height_in: height_in ?? null,
      fabric_ids: fabric_ids ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
