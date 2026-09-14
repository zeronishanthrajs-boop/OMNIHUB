import { NextRequest, NextResponse } from 'next/server';
import { getPredictionById } from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await checkAuth(req);
    if (!isAuthed) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
    const { id } = await params;
    const data = await getPredictionById(id);
    if (!data) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return handleApiError(err, 'GET /api/predictions/[id]');
  }
}
