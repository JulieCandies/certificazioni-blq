const enc = new TextEncoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(secret, ttlMs = 1000 * 60 * 60 * 8) {
  const exp = Date.now() + ttlMs;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(exp)));
  return `${exp}.${bufToHex(sig)}`;
}

export async function verifySessionToken(token, secret) {
  if (!token) return false;
  const [expStr, sigHex] = token.split('.');
  if (!expStr || !sigHex) return false;
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return false;
  const key = await getKey(secret);
  const expected = bufToHex(await crypto.subtle.sign('HMAC', key, enc.encode(expStr)));
  return expected === sigHex;
}
