import { NextRequest, NextResponse } from 'next/server';
import { getSimilarNodes } from '@/lib/db';
import { z } from 'zod';
import { handleApiError, handleValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const similarQuerySchema = z.object({
  id: z.string(),
  threshold: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseFloat(String(val))),
    z.number().min(0).max(1).default(0.5)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().min(1).max(100).default(10)
  )
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const parsed = similarQuerySchema.safeParse({
      id,
      threshold: searchParams.get('threshold') || undefined,
      limit: searchParams.get('limit') || undefined
    });

    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const { threshold, limit } = parsed.data;

    const nodes = await getSimilarNodes(id, threshold, limit);
    return NextResponse.json(nodes);
  } catch (err: any) {
    return handleApiError(err, 'GET /api/similar/[id]');
  }
}
