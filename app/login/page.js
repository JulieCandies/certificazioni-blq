'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codiceFiscale, testPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Accesso non riuscito.');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('certifica-session', JSON.stringify({ user: data.user, test: data.test }));
      router.push('/quiz');
    } catch (err) {
      setError('Errore di rete. Riprova.');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="dot" />Certifica</div>
        <Link href="/" className="btn secondary" style={{ padding: '7px 12px', fontSize: 13 }}>← Home</Link>
      </div>
      <div className="wrap">
        <span className="eyebrow">Utente aeroportuale</span>
        <h1 style={{ fontSize: 24 }}>Accedi al test</h1>
        <form className="card" style={{ maxWidth: 440 }} onSubmit={handleSubmit}>
          <label htmlFor="cf">Codice fiscale</label>
          <input
            id="cf" type="text" value={codiceFiscale} placeholder="RSSMRA93A01H501U"
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => setCodiceFiscale(e.target.value)}
          />
          <label htmlFor="pw">Password del test</label>
          <input
            id="pw" type="text" value={testPassword} placeholder="PROVA"
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => setTestPassword(e.target.value)}
          />
          {error && <div className="error-text">{error}</div>}
          <div style={{ marginTop: 18 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Verifica…' : 'Inizia il test'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
