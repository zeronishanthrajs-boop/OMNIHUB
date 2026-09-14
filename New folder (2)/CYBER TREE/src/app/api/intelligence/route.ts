import { NextResponse } from 'next/server';
import { getIntelligence } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getIntelligence();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('API /intelligence error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
