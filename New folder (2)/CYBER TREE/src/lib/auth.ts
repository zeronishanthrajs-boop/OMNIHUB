import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isAuthRequired = !!(supabaseUrl && supabaseAnonKey);

/**
 * Checks if the request contains a valid Supabase JWT token.
 * Returns true if authenticated, or if running in local SQLite mode (auth bypass).
 */
export async function checkAuth(req: NextRequest): Promise<boolean> {
  if (!isAuthRequired) {
    return true; // Bypass authentication when running against local SQLite DB
  }

  const token = req.cookies.get('sb-access-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return false;
  }

  try {
    const client = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('Authentication check failed:', err);
    return false;
  }
}

/**
 * Creates a request-scoped Supabase client that inherits the user's JWT authorization header.
 * Allows executing queries within the user's RLS context.
 */
export function getSupabaseClient(req: NextRequest) {
  if (!isAuthRequired) return null;
  const token = req.cookies.get('sb-access-token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (token) {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return createClient(supabaseUrl!, supabaseAnonKey!);
}
