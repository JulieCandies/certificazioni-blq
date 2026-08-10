import { NextResponse } from 'next/server';
import { kv, listByPrefix } from '../../../../lib/kv';
import { ensureSeed } from '../../../../lib/seed';

export async function GET() {
  await ensureSeed();
  const users = await listByPrefix('user:');
  users.sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''));
  return NextResponse.json({ users });
}
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const cf = (body.codiceFiscale || '').toUpperCase().trim();
  if (!/^[A-Z0-9]{16}$/.test(cf)) {
    return NextResponse.json(
      { error: 'Il codice fiscale deve avere 16 caratteri alfanumerici.' },
      { status: 400 }
    );
  }
  if (!body.nome?.trim() || !body.cognome?.trim()) {
    return NextResponse.json({ error: 'Nome e cognome sono obbligatori.' }, { status: 400 });
  const user = {
    codiceFiscale: cf,
    nome: body.nome.trim(),
    cognome: body.cognome.trim(),
    dataNascita: body.dataNascita || ''
  };
  await kv.set('user:' + cf, user);
  return NextResponse.json({ ok: true, user });
export const dynamic = 'force-dynamic';
