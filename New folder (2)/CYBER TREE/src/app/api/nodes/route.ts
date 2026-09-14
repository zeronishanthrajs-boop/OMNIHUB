import { NextRequest, NextResponse } from 'next/server';
import { queryNodes } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { z } from 'zod';
import { handleApiError, handleValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const nodesQuerySchema = z.object({
  type: z.string().default('all'),
  search: z.string().optional(),
  tag: z.string().optional(),
  semantic: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().min(1).max(100).default(25)
  ),
  offset: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().min(0).default(0)
  ),
  threshold: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : parseFloat(String(val))),
    z.number().min(0).max(1).default(0.5)
  )
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = nodesQuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      tag: searchParams.get('tag') || undefined,
      semantic: searchParams.get('semantic') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      threshold: searchParams.get('threshold') || undefined
    });

    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const { type, search, tag, semantic, limit, offset, threshold } = parsed.data;

    let embeddingVector: number[] | undefined = undefined;
    if (semantic && search) {
      try {
        const emb = await getEmbedding(search);
        embeddingVector = emb.vector;
      } catch (err) {
        console.error('Failed to generate embedding for search query:', err);
      }
    }

    const nodes = await queryNodes({
      type,
      search: semantic ? undefined : search,  // When semantic, don't also FTS
      tag,
      limit,
      offset,
      semantic,
      embeddingVector,
      threshold
    });

    return NextResponse.json(nodes);
  } catch (err: any) {
    return handleApiError(err, 'GET /api/nodes');
  }
}
