import { NextRequest, NextResponse } from 'next/server';
import { classifyText } from '@/lib/classifier';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let text = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      text = body.text || '';
    } else {
      text = await req.text();
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Text body cannot be empty' },
        { status: 400 }
      );
    }

    const prediction = classifyText(text);

    return NextResponse.json(prediction);
  } catch (err: any) {
    console.error('API Classify error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
