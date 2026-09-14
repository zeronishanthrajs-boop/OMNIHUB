import { NextRequest, NextResponse } from 'next/server';
import { getPredictions } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    const predictions = await getPredictions(status);
    return NextResponse.json(predictions);
  } catch (err: any) {
    return handleApiError(err, 'GET /api/predictions');
  }
}
