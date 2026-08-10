import { NextResponse } from 'next/server';
import { kv } from '../../../lib/kv';
import { ensureSeed } from '../../../lib/seed';

export async function POST(req) {
  await ensureSeed();
  const body = await req.json().catch(() => ({}));
  const cf = (body.codiceFiscale || '').toUpperCase().trim();
  const testPassword = (body.testPassword || '').toUpperCase().trim();

  if (!/^[A-Z0-9]{16}$/.test(cf)) {
    return NextResponse.json({ error: 'Codice fiscale non valido (16 caratteri).' }, { status: 400 });
  }
  if (!testPassword) {
    return NextResponse.json({ error: 'Inserisci la password del test.' }, { status: 400 });
  }

  const user = await kv.get('user:' + cf);
  if (!user) {
    return NextResponse.json(
      { error: 'Codice fiscale non abilitato. Contatta l\u2019amministratore.' },
      { status: 404 }
    );
  }

  const test = await kv.get('test:' + testPassword);
  if (!test) {
    return NextResponse.json({ error: 'Password del test non riconosciuta.' }, { status: 404 });
  }

  // Non inviamo le risposte corrette né le spiegazioni finché il test non è stato consegnato.
  const safeTest = {
    code: test.code,
    title: test.title,
    passMark: test.passMark,
    questions: test.questions.map((q) => ({ text: q.text, options: q.options }))
  };

  return NextResponse.json({ ok: true, user, test: safeTest });
}
