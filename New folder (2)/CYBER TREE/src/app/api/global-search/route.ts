import { NextRequest, NextResponse } from 'next/server';
import { globalSearch } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    
    if (!q.trim()) {
      return NextResponse.json({ nodes: [], predictions: [], trends: [], sources: [] });
    }

    const results = await globalSearch(q);
    return NextResponse.json(results);
  } catch (err: any) {
    console.error('API global-search error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
