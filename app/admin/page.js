'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}
function statusFor(expiryDate) {
  const left = daysBetween(todayStr(), expiryDate);
  if (left < 0) return { key: 'expired', label: 'Scaduta', days: left };
  if (left <= 60) return { key: 'expiring', label: 'In scadenza', days: left };
  return { key: 'valid', label: 'Valida', days: left };
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
  doc.text(`Codice test: ${result.testCode} · Validità: ${result.validityMonths || ''} mesi`, W / 2, 154, { align: 'center' });
  doc.text('Documento generato automaticamente dalla piattaforma di certificazione interna.', W / 2, H - 22, { align: 'center' });

  const safeName = `${result.nome}_${result.cognome}`.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`certificato-${safeName}-${result.testCode}.pdf`);
}

const emptyDraft = () => ({
  title: '', code: '', validityMonths: 24, passMark: 80,
  questions: [{ text: '', options: ['', '', '', ''], correct: 0, explanation: '' }]
});

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState('riepilogo');
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userForm, setUserForm] = useState({ codiceFiscale: '', nome: '', cognome: '', dataNascita: '' });
  const [userError, setUserError] = useState(null);

  const [draft, setDraft] = useState(emptyDraft());
  const [testError, setTestError] = useState(null);
  const [creatingTest, setCreatingTest] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [uRes, tRes, rRes] = await Promise.all([
        fetch('/api/admin/users'), fetch('/api/admin/tests'), fetch('/api/admin/results')
      ]);
      if (uRes.status === 401 || tRes.status === 401 || rRes.status === 401) { router.replace('/admin/login'); return; }
      const [u, t, r] = await Promise.all([uRes.json(), tRes.json(), rRes.json()]);
      setUsers(u.users || []); setTests(t.tests || []); setResults(r.results || []);
    } catch (e) {
      setError('Impossibile caricare i dati.');
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/');
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setUserError(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm)
    });
    const data = await res.json();
    if (!res.ok) { setUserError(data.error); return; }
    setUserForm({ codiceFiscale: '', nome: '', cognome: '', dataNascita: '' });
    loadAll();
  }

  async function handleDeleteUser(cf) {
    if (!confirm('Rimuovere questo addetto? Non potrà più accedere ai test finché non lo riaggiungi.')) return;
    await fetch('/api/admin/users/' + encodeURIComponent(cf), { method: 'DELETE' });
    loadAll();
  }

  async function handleSaveTest(e) {
    e.preventDefault();
    setTestError(null);
    for (const q of draft.questions) {
      if (!q.text.trim() || q.options.some((o) => !o.trim())) {
        setTestError('Ogni domanda deve avere testo e tutte e 4 le opzioni compilate.'); return;
      }
    }
    setCreatingTest(true);
    const res = await fetch('/api/admin/tests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft)
    });
    const data = await res.json();
    setCreatingTest(false);
    if (!res.ok) { setTestError(data.error); return; }
    setDraft(emptyDraft());
    setTab('test');
    loadAll();
  }

  async function handleDeleteTest(code) {
    if (!confirm('Eliminare questo test? I certificati già rilasciati restano visibili.')) return;
    await fetch('/api/admin/tests/' + encodeURIComponent(code), { method: 'DELETE' });
    loadAll();
  }

  function updateQuestion(qi, patch) {
    setDraft((d) => {
      const questions = d.questions.slice();
      questions[qi] = { ...questions[qi], ...patch };
      return { ...d, questions };
    });
  }
  function updateOption(qi, oi, value) {
    setDraft((d) => {
      const questions = d.questions.slice();
      const options = questions[qi].options.slice();
      options[oi] = value;
      questions[qi] = { ...questions[qi], options };
      return { ...d, questions };
    });
  }

  const expiring = results.filter((r) => r.passed && statusFor(r.expiryDate).key !== 'valid');

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="dot" />Certifica — Admin</div>
        <button className="btn secondary" style={{ padding: '7px 12px', fontSize: 13 }} onClick={handleLogout}>Esci</button>
      </div>
      <div className="wrap">
        <div className="tabs">
          <button className={`tab-btn ${tab === 'riepilogo' ? 'active' : ''}`} onClick={() => setTab('riepilogo')}>Riepilogo scadenze</button>
          <button className={`tab-btn ${tab === 'addetti' ? 'active' : ''}`} onClick={() => setTab('addetti')}>Addetti</button>
          <button className={`tab-btn ${tab === 'test' ? 'active' : ''}`} onClick={() => setTab('test')}>Test</button>
          <button className={`tab-btn ${tab === 'nuovo-test' ? 'active' : ''}`} onClick={() => setTab('nuovo-test')}>+ Nuovo test</button>
        </div>

        {loading && <div className="card"><p style={{ margin: 0 }}>Caricamento…</p></div>}
        {error && <div className="card"><p style={{ margin: 0, color: 'var(--coral)' }}>{error}</p></div>}

        {!loading && tab === 'riepilogo' && (
          <>
            <div className="card" style={expiring.length ? { borderColor: 'var(--amber)', background: '#FFFBF2' } : undefined}>
              <span className="eyebrow" style={expiring.length ? { color: '#8A6416' } : undefined}>Prossimi 2 mesi</span>
              {expiring.length === 0 ? (
                <p style={{ margin: 0 }}>✅ Nessuna certificazione in scadenza nei prossimi 60 giorni.</p>
              ) : (
                <>
                  <h3 style={{ fontSize: 16, marginTop: 2 }}>{expiring.length} certificazion{expiring.length === 1 ? 'e' : 'i'} da rinnovare o già scadute</h3>
                  <table>
                    <thead><tr><th>Addetto</th><th>Test</th><th>Scadenza</th><th>Stato</th><th></th></tr></thead>
                    <tbody>
                      {expiring.map((r) => {
                        const st = statusFor(r.expiryDate);
                        return (
                          <tr key={r.testCode + r.codiceFiscale}>
                            <td>{r.nome} {r.cognome}<br /><span className="muted mono">{r.codiceFiscale}</span></td>
                            <td>{r.testTitle}</td>
                            <td className="mono">{fmtDate(r.expiryDate)}</td>
                            <td><span className={`pill ${st.key}`}>{st.label} · {st.key === 'expired' ? Math.abs(st.days) + 'g fa' : 'tra ' + st.days + 'g'}</span></td>
                            <td><button className="btn secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => downloadCertificatePDF(r)}>PDF</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            <div className="card">
              <span className="eyebrow">Tutti i certificati</span>
              {results.length === 0 ? <div className="empty">Ancora nessun addetto ha completato un test.</div> : (
                <table>
                  <thead><tr><th>Addetto</th><th>Test</th><th>Punteggio</th><th>Scadenza</th><th>Stato</th><th></th></tr></thead>
                  <tbody>
                    {results.map((r) => {
                      const st = r.passed ? statusFor(r.expiryDate) : { key: 'expired', label: 'Non superato', days: null };
                      return (
                        <tr key={r.testCode + r.codiceFiscale}>
                          <td>{r.nome} {r.cognome}<br /><span className="muted mono">{r.codiceFiscale}</span></td>
                          <td>{r.testTitle}</td>
                          <td className="mono">{r.score}/{r.total}</td>
                          <td className="mono">{fmtDate(r.expiryDate)}</td>
                          <td><span className={`pill ${st.key}`}>{st.label}</span></td>
                          <td>{r.passed && <button className="btn secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => downloadCertificatePDF(r)}>Scarica PDF</button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {!loading && tab === 'addetti' && (
          <>
            <div className="card">
              <span className="eyebrow">Aggiungi addetto</span>
              <form onSubmit={handleAddUser}>
                <label>Codice fiscale</label>
                <input type="text" style={{ textTransform: 'uppercase' }} value={userForm.codiceFiscale}
                  onChange={(e) => setUserForm({ ...userForm, codiceFiscale: e.target.value })} placeholder="RSSMRA93A01H501U" />
                <label>Nome</label>
                <input type="text" value={userForm.nome} onChange={(e) => setUserForm({ ...userForm, nome: e.target.value })} />
                <label>Cognome</label>
                <input type="text" value={userForm.cognome} onChange={(e) => setUserForm({ ...userForm, cognome: e.target.value })} />
                <label>Data di nascita (facoltativa)</label>
                <input type="text" value={userForm.dataNascita} onChange={(e) => setUserForm({ ...userForm, dataNascita: e.target.value })} placeholder="AAAA-MM-GG" />
                {userError && <div className="error-text">{userError}</div>}
                <div style={{ marginTop: 16 }}><button className="btn" type="submit">Aggiungi</button></div>
              </form>
            </div>
            <div className="card">
              <span className="eyebrow">Addetti abilitati ({users.length})</span>
              {users.length === 0 ? <div className="empty">Nessun addetto ancora.</div> : (
                <table>
                  <thead><tr><th>Nome</th><th>Codice fiscale</th><th>Nascita</th><th></th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.codiceFiscale}>
                        <td>{u.nome} {u.cognome}</td>
                        <td className="mono">{u.codiceFiscale}</td>
                        <td className="mono">{u.dataNascita || '—'}</td>
                        <td><button className="btn danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDeleteUser(u.codiceFiscale)}>Rimuovi</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {!loading && tab === 'test' && (
          <div className="card">
            <span className="eyebrow">Test creati ({tests.length})</span>
            {tests.length === 0 ? <div className="empty">Nessun test ancora.</div> : tests.map((t) => (
              <div className="qcard" key={t.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted">Validità: {t.validityMonths} mesi · Soglia: {t.passMark}% · {t.questions.length} domande</div>
                  <div className="code-box mono" style={{ fontSize: 15, padding: '8px 12px', marginTop: 8 }}>{t.code}</div>
                </div>
                <button className="btn danger" onClick={() => handleDeleteTest(t.code)}>Elimina</button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'nuovo-test' && (
          <div className="card">
            <span className="eyebrow">Nuovo test</span>
            <form onSubmit={handleSaveTest}>
              <label>Titolo del test</label>
              <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Es. Sicurezza airside" />

              <label>Codice / password del test</label>
              <input type="text" style={{ textTransform: 'uppercase' }} value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="Es. SECURITY" />
              <p style={{ marginTop: 4, fontSize: 12 }}>Questa è la password che l&apos;addetto userà insieme al proprio codice fiscale per accedere.</p>

              <label>Validità certificazione (mesi)</label>
              <input type="number" style={{ maxWidth: 140 }} value={draft.validityMonths} min={1}
                onChange={(e) => setDraft({ ...draft, validityMonths: e.target.value })} />

              <label>Soglia minima per superare (%)</label>
              <input type="number" style={{ maxWidth: 140 }} value={draft.passMark} min={1} max={100}
                onChange={(e) => setDraft({ ...draft, passMark: e.target.value })} />

              <div style={{ marginTop: 20 }}>
                <div className="flex-between">
                  <span className="eyebrow" style={{ margin: 0 }}>Domande ({draft.questions.length})</span>
                  <button type="button" className="btn secondary"
                    onClick={() => setDraft((d) => ({ ...d, questions: [...d.questions, { text: '', options: ['', '', '', ''], correct: 0, explanation: '' }] }))}>
                    + Aggiungi domanda
                  </button>
                </div>

                {draft.questions.map((q, qi) => (
                  <div className="qcard" key={qi}>
                    <div className="flex-between">
                      <label style={{ margin: 0 }}>Domanda {qi + 1}</label>
                      {draft.questions.length > 1 && (
                        <button type="button" className="btn danger" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== qi) }))}>
                          Rimuovi
                        </button>
                      )}
                    </div>
                    <input type="text" value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} placeholder="Testo della domanda" />
                    {q.options.map((opt, oi) => (
                      <div className="opt-row" key={oi}>
                        <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} onChange={() => updateQuestion(qi, { correct: oi })} />
                        <input type="text" value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Opzione ${oi + 1}`} />
                      </div>
                    ))}
                    <label style={{ marginTop: 12 }}>Spiegazione (mostrata se l&apos;addetto sbaglia)</label>
                    <textarea value={q.explanation} onChange={(e) => updateQuestion(qi, { explanation: e.target.value })} placeholder="Perché quella è la risposta corretta…" />
                  </div>
                ))}
              </div>

              {testError && <div className="error-text">{testError}</div>}
              <div style={{ marginTop: 20 }}>
                <button className="btn" type="submit" disabled={creatingTest}>{creatingTest ? 'Salvataggio…' : 'Salva test'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
