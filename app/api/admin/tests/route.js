import { NextResponse } from 'next/server';
import { kv, listByPrefix } from '../../../../lib/kv';
import { ensureSeed } from '../../../../lib/seed';

export async function GET() {
  await ensureSeed();
  const tests = await listByPrefix('test:');
  tests.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return NextResponse.json({ tests });
}
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const code = (body.code || '').toUpperCase().trim().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
    return NextResponse.json(
      { error: 'Il codice/password del test deve avere 3-20 caratteri: lettere, numeri o trattini.' },
      { status: 400 }
    );
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Serve un titolo per il test.' }, { status: 400 });
  const questions = Array.isArray(body.questions) ? body.questions : [];
  if (!questions.length) {
    return NextResponse.json({ error: 'Il test deve avere almeno una domanda.' }, { status: 400 });
  for (const q of questions) {
    if (!q.text?.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !o?.trim())) {
      return NextResponse.json(
        { error: 'Ogni domanda deve avere testo e tutte e 4 le opzioni compilate.' },
        { status: 400 }
      );
    }
  const existing = await kv.get('test:' + code);
  if (existing) {
      { error: `Il codice "${code}" è già usato dal test "${existing.title}".` },
      { status: 409 }
  const test = {
    code,
    title: body.title.trim(),
    validityMonths: Number(body.validityMonths) || 24,
    passMark: Number(body.passMark) || 80,
    questions: questions.map((q) => ({
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()),
      correct: Number(q.correct) || 0,
      explanation: (q.explanation || '').trim()
    })),
    createdAt: new Date().toISOString()
  };
  await kv.set('test:' + code, test);
  return NextResponse.json({ ok: true, test });
export const dynamic = 'force-dynamic';
