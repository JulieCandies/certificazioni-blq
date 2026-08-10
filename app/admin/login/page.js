'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Accesso non riuscito.'); setLoading(false); return; }
      router.push('/admin');
    } catch (e) {
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
        <form className="card" style={{ maxWidth: 420, margin: '20px auto' }} onSubmit={handleSubmit}>
          <span className="eyebrow">Area amministratore</span>
          <h2 style={{ fontSize: 20 }}>Accedi</h2>
          <p>Inserisci la password amministratore configurata su Vercel.</p>
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <div className="error-text">{error}</div>}
          <div style={{ marginTop: 18 }}>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Verifica…' : 'Entra'}</button>
          </div>
        </form>
      </div>
    </>
  );
}
