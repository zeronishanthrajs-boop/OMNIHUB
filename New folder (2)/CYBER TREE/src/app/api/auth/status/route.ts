import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuthed = await checkAuth(req);
  if (!isAuthed) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}
