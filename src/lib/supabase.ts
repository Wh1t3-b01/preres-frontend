/**
 * Sotto Sotto Bar & Grill — Supabase Client Configuration
 * Production-ready initialization with secure token persistence,
 * auto-refresh, and environment validation.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

/**
 * Checks whether valid Supabase credentials have been injected via environment variables.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.info(
    '[Supabase Auth] Running in local demo mode. To connect to live Supabase Auth, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

/**
 * Initialized Supabase Client Singleton.
 * Uses localStorage with a scoped storage key for isolated token storage,
 * automatic token rotation, and URL session recovery (PKCE / Magic Links / OAuth).
 */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sotto_sotto_auth_session',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
