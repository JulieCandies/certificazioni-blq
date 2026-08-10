import { NextResponse } from 'next/server';
import { kv } from '../../../../../lib/kv';

export async function DELETE(req, { params }) {
  await kv.del('test:' + decodeURIComponent(params.code).toUpperCase());
  return NextResponse.json({ ok: true });
}
