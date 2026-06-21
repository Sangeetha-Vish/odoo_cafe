import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

let supabaseAdmin = null;
let supabaseAnon = null;

/**
 * Returns a Supabase client initialized with the SERVICE ROLE key.
 * This bypasses RLS for backend DB reads. Do NOT use for auth.getUser() —
 * use getAnonClient() for JWT verification.
 */
export function getSupabaseClient() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the backend environment.');
  }

  supabaseAdmin = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
  });

  return supabaseAdmin;
}

/**
 * Returns a Supabase client initialized with the ANON key.
 * Use this for auth.getUser(token) — the anon key is required to verify
 * user-issued JWTs via the Supabase Auth API.
 */
export function getAnonClient() {
  if (supabaseAnon) return supabaseAnon;

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in the backend environment.');
  }

  supabaseAnon = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
  });

  return supabaseAnon;
}

/**
 * Creates a scoped Supabase client that forwards the caller's JWT for RLS-aware queries.
 */
export function getSupabaseClientForToken(accessToken) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: WebSocket,
    },
  });
}

export function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}
