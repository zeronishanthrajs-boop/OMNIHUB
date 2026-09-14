import { NextResponse } from 'next/server';

export function handleApiError(err: any, endpointName: string): NextResponse {
  // Generate a random 4-digit opaque trace ID
  const traceNum = Math.floor(1000 + Math.random() * 9000);
  const traceId = `ERR-TR-${traceNum}`;
  
  // Log the real detailed error to server-side stdout/stderr with the trace ID
  console.error(`[${traceId}] Error in API endpoint ${endpointName}:`, err);
  
  // Return a generic sanitized response to the public client
  return NextResponse.json(
    { 
      error: 'An internal error occurred. Please contact system administrators.', 
      code: 'INTERNAL_SERVER_ERROR',
      traceId 
    },
    { status: 500 }
  );
}

export function handleValidationError(err: any): NextResponse {
  return NextResponse.json(
    { 
      error: 'Invalid request parameters.', 
      code: 'VALIDATION_ERROR',
      details: err.errors || err.message 
    },
    { status: 400 }
  );
}
