import { kv } from '@vercel/kv';

export { kv };

// Vercel KV salva e legge automaticamente oggetti JSON: non serve
// fare JSON.stringify/parse a mano.
export async function listByPrefix(prefix) {
  const keys = await kv.keys(prefix + '*');
  if (!keys.length) return [];
  const values = await Promise.all(keys.map((k) => kv.get(k)));
  return values.filter(Boolean);
}
