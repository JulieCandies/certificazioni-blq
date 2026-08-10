export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + Number(months));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export function statusFor(expiryDate) {
  const left = daysBetween(todayStr(), expiryDate);
  if (left < 0) return { key: 'expired', label: 'Scaduta', days: left };
  if (left <= 60) return { key: 'expiring', label: 'In scadenza', days: left };
  return { key: 'valid', label: 'Valida', days: left };
}

export function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}
