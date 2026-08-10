import { NextResponse } from 'next/server';
import { listByPrefix } from '../../../../lib/kv';

export async function GET() {
  const results = await listByPrefix('result:');
  results.sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''));
  return NextResponse.json({ results });
}
