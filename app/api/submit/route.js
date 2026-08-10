import { NextResponse } from 'next/server';
import { kv } from '../../../lib/kv';
import { todayStr, addMonths } from '../../../lib/dates';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const cf = (body.codiceFiscale || '').toUpperCase().trim();
  const testCode = (body.testCode || '').toUpperCase().trim();
  const answers = Array.isArray(body.answers) ? body.answers : [];

  const user = await kv.get('user:' + cf);
  const test = await kv.get('test:' + testCode);
  if (!user || !test) {
    return NextResponse.json({ error: 'Sessione non valida, rifai l\u2019accesso.' }, { status: 404 });
  }

  let score = 0;
  test.questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
  });
  const total = test.questions.length;
  const passed = (score / total) * 100 >= (test.passMark || 80);
  const certifiedDate = todayStr();
  const expiryDate = addMonths(certifiedDate, test.validityMonths);

  const result = {
    testCode: test.code,
    testTitle: test.title,
    codiceFiscale: cf,
    nome: user.nome,
    cognome: user.cognome,
    score,
    total,
    passed,
    certifiedDate: passed ? certifiedDate : null,
    expiryDate: passed ? expiryDate : null,
    validityMonths: test.validityMonths,
    attemptDate: new Date().toISOString(),
    answers
  };

  if (passed) {
    await kv.set('result:' + test.code + ':' + cf, result);
  }

  return NextResponse.json({
    ok: true,
    result,
    review: test.questions.map((q) => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation
    }))
  });
}
