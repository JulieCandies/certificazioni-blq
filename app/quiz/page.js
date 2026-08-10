'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function downloadCertificatePDF(result) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W = 297, H = 210;
  const ink = [20, 33, 61], teal = [15, 139, 141], slate = [92, 107, 115];

  doc.setDrawColor(...teal); doc.setLineWidth(1.2);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(...ink); doc.setLineWidth(0.4);
  doc.rect(14, 14, W - 28, H - 28);

  doc.setTextColor(...teal);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text(`CERTIFICATO DI SUPERAMENTO TEST — ${result.testTitle.toUpperCase()}`, W / 2, 44, { align: 'center' });

  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text(`${result.nome} ${result.cognome}`, W / 2, 68, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  doc.setTextColor(...slate);
  doc.text(`Codice fiscale: ${result.codiceFiscale}`, W / 2, 78, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('ha completato con successo il test', W / 2, 92, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text(result.testTitle, W / 2, 104, { align: 'center' });

  const pct = Math.round((result.score / result.total) * 100);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
  doc.setTextColor(...slate);
  doc.text(`Percentuale di risposte esatte: ${pct}% (${result.score} su ${result.total})`, W / 2, 116, { align: 'center' });

  doc.setDrawColor(...teal); doc.setLineWidth(0.3);
  doc.line(W / 2 - 60, 128, W / 2 + 60, 128);

  doc.setFontSize(11); doc.setTextColor(...ink);
  doc.text(`Data di esecuzione: ${fmtDate(result.certifiedDate)}`, W / 2 - 60, 140, { align: 'left' });
  doc.text(`Valido fino al: ${fmtDate(result.expiryDate)}`, W / 2 + 60, 140, { align: 'right' });

  doc.setFontSize(9); doc.setTextColor(...slate);
  doc.text(`Codice test: ${result.testCode} · Validità: ${result.validityMonths} mesi`, W / 2, 154, { align: 'center' });
  doc.text('Documento generato automaticamente dalla piattaforma di certificazione interna.', W / 2, H - 22, { align: 'center' });

  const safeName = `${result.nome}_${result.cognome}`.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`certificato-${safeName}-${result.testCode}.pdf`);
}

export default function QuizPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null); // { result, review }
  const [openWhy, setOpenWhy] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('certifica-session');
    if (!raw) { router.replace('/login'); return; }
    const parsed = JSON.parse(raw);
    setSession(parsed);
    setAnswers(new Array(parsed.test.questions.length).fill(undefined));
  }, [router]);

  if (!session) return null;

  const { test, user } = session;

  if (outcome) {
    const { result, review } = outcome;
    const pct = Math.round((result.score / result.total) * 100);
    const color = result.passed ? 'var(--teal)' : 'var(--coral)';
    return (
      <>
        <div className="topbar"><div className="brand"><span className="dot" />Certifica</div></div>
        <div className="wrap">
          <div className="card result-hero">
            <div className="badge-score" style={{ color }}>{pct}%</div>
            <h2 className="result-title">{result.passed ? 'Test superato ✅' : 'Test non superato'}</h2>
            <p>{user.nome} {user.cognome} — {result.testTitle}<br />Risposte corrette: {result.score} su {result.total}</p>
            {result.passed ? (
              <>
                <p style={{ marginTop: 16 }}>
                  Eseguito il <span className="mono">{fmtDate(result.certifiedDate)}</span><br />
                  Valido fino al <span className="mono">{fmtDate(result.expiryDate)}</span>
                </p>
                <div style={{ marginTop: 20 }}>
                  <button className="btn" onClick={() => downloadCertificatePDF(result)}>⬇ Scarica certificato PDF</button>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 16, color: 'var(--coral)' }}>Contatta l&apos;amministratore per un nuovo tentativo.</p>
            )}
          </div>

          <div className="card">
            <span className="eyebrow">Revisione delle risposte</span>
            <h3 style={{ fontSize: 16, marginTop: 2 }}>Cosa hai risposto</h3>
            {review.map((q, i) => {
              const yourIdx = result.answers[i];
              const isCorrect = yourIdx === q.correct;
              return (
                <div key={i} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="review-head">
                    <span className="review-mark">{isCorrect ? '✅' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                      <div className="review-q">{i + 1}. {q.text}</div>
                      <div className="review-ans">
                        Hai risposto: <span className={isCorrect ? '' : 'your'}>{q.options[yourIdx] ?? '—'}</span>
                        {!isCorrect && <><br />Risposta corretta: <span className="right">{q.options[q.correct]}</span></>}
                      </div>
                      {!isCorrect && (
                        <>
                          <button
                            className="why-btn"
                            onClick={() => setOpenWhy((s) => ({ ...s, [i]: !s[i] }))}
                          >
                            {openWhy[i] ? 'Nascondi spiegazione' : 'Perché? Vedi la spiegazione'}
                          </button>
                          {openWhy[i] && (
                            <div className="why-box">{q.explanation || 'Nessuna spiegazione fornita per questa domanda.'}</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/" className="btn secondary">Torna alla home</Link>
        </div>
      </>
    );
  }

  const q = test.questions[step];
  const selected = answers[step];
  const total = test.questions.length;

  async function handleNext() {
    if (step < total - 1) { setStep(step + 1); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codiceFiscale: user.codiceFiscale, testCode: test.code, answers })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invio non riuscito.'); setSubmitting(false); return; }
      setOutcome({ result: data.result, review: data.review });
    } catch (e) {
      setError('Errore di rete. Riprova.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="topbar"><div className="brand"><span className="dot" />Certifica</div></div>
      <div className="wrap">
        <span className="eyebrow">{test.title}</span>
        <h2 style={{ fontSize: 19, marginBottom: 16 }}>Domanda {step + 1} di {total}</h2>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} /></div>
        <div className="card">
          <div className="quiz-q">{q.text}</div>
          {q.options.map((opt, oi) => (
            <div
              key={oi}
              className={`quiz-opt ${selected === oi ? 'selected' : ''}`}
              onClick={() => { const next = answers.slice(); next[step] = oi; setAnswers(next); }}
            >
              <span className="mono" style={{ color: 'var(--slate)', fontSize: 12 }}>{String.fromCharCode(65 + oi)}</span>
              <span>{opt}</span>
            </div>
          ))}
          {error && <div className="error-text">{error}</div>}
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Indietro</button>
            <button className="btn" disabled={selected === undefined || submitting} onClick={handleNext}>
              {submitting ? 'Invio…' : step === total - 1 ? 'Termina e correggi' : 'Avanti'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
