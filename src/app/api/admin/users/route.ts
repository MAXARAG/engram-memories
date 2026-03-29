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
  // list users (admins only)
  const requester = await getRequester(req);
  if (!requester || requester.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // list auth.users via admin key
  const { data, error } = await (supabaseAdmin as any).from('auth.users').select('id, email, raw_user_meta_data, created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req: Request) {
  // create new user
  const requester = await getRequester(req);
  if (!requester || requester.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { email, password, role = 'usuario' } = body;
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // create auth user using service role
  const { data: created, error } = await (supabaseAdmin as any).auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  } as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // insert profile
  await (supabaseAdmin as any).from('profiles').insert({ auth_uid: created.user?.id, email, role });

  // audit log
  await (supabaseAdmin as any).from('audit_logs').insert({
    actor_uid: requester.id,
    actor_email: requester.email,
    action: 'create_user',
    target_uid: created.user?.id,
    target_email: email,
    description: `Created user ${email} with role ${role}`,
  });

  return NextResponse.json({ user: created.user });
}

export async function DELETE(req: Request) {
  const requester = await getRequester(req);
  if (!requester || requester.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // delete profile and auth user
  await (supabaseAdmin as any).from('profiles').delete().eq('auth_uid', id);
  const { error } = await (supabaseAdmin as any).auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabaseAdmin as any).from('audit_logs').insert({
    actor_uid: requester.id,
    actor_email: requester.email,
    action: 'delete_user',
    target_uid: id,
    target_email: null,
    description: `Deleted user ${id}`,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const requester = await getRequester(req);
  if (!requester || requester.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { id, role } = body;
  if (!id || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { error } = await (supabaseAdmin as any).from('profiles').update({ role }).eq('auth_uid', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabaseAdmin as any).from('audit_logs').insert({
    actor_uid: requester.id,
    actor_email: requester.email,
    action: 'update_role',
    target_uid: id,
    target_email: null,
    description: `Set role=${role}`,
  });

  return NextResponse.json({ ok: true });
}
