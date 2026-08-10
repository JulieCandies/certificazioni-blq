import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="dot" />Certifica</div>
      </div>
      <div className="wrap">
        <div style={{ padding: '30px 0 6px' }}>
          <span className="eyebrow">Test di certificazione interna</span>
          <h1 style={{ fontSize: 28 }}>Chi sei oggi?</h1>
          <p>Scegli il tuo ruolo per continuare.</p>
        </div>
        <div className="role-grid">
          <Link href="/admin/login" className="role-card">
            <span className="icon">🗂️</span>
            <h3 style={{ fontSize: 17 }}>Amministratore</h3>
            <p style={{ marginTop: 6 }}>Gestisci addetti, test e certificazioni in scadenza.</p>
          </Link>
          <Link href="/login" className="role-card">
            <span className="icon">🧑‍✈️</span>
            <h3 style={{ fontSize: 17 }}>Utente aeroportuale</h3>
            <p style={{ marginTop: 6 }}>Accedi con codice fiscale e password del test da svolgere.</p>
          </Link>
        </div>
        <div className="footer-note">Piattaforma interna — non condividere le credenziali con persone esterne all&apos;azienda.</div>
      </div>
    </>
  );
}
