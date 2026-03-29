import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'ezpeleta.juan@gmail.com';

async function getRequester(req: Request) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) return null;
  const { data } = await supabase.auth.getUser(auth as string);
  return data.user || null;
}

export async function GET(req: Request) {
  const requester = await getRequester(req);
  if (!requester || requester.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await (supabaseAdmin as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
