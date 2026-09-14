import { NextRequest, NextResponse } from 'next/server';
import { getSubgraph, getDefaultGraph } from '@/lib/db';
import { z } from 'zod';
import { handleApiError, handleValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const graphQuerySchema = z.object({
  centerNodeId: z.string().optional(),
  depth: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().min(1).max(4).default(1)
  )
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = graphQuerySchema.safeParse({
      centerNodeId: searchParams.get('centerNodeId') || undefined,
      depth: searchParams.get('depth') || undefined
    });

    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const { centerNodeId, depth } = parsed.data;
    
    let graphData;
    if (centerNodeId) {
      graphData = await getSubgraph(centerNodeId, depth);
    } else {
      graphData = await getDefaultGraph();
    }
    
    return NextResponse.json(graphData);
  } catch (err: any) {
    return handleApiError(err, 'GET /api/graph');
  }
}
