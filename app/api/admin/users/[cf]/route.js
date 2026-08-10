import { NextResponse } from 'next/server';
import { kv } from '../../../../../lib/kv';

export async function DELETE(req, { params }) {
  await kv.del('user:' + decodeURIComponent(params.cf).toUpperCase());
  return NextResponse.json({ ok: true });
}
