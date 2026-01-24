import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Debug logging - will be removed once working
console.log('[Supabase] URL configured:', !!SUPABASE_URL, SUPABASE_URL ? `(${SUPABASE_URL.substring(0, 20)}...)` : '(empty)');
console.log('[Supabase] Key configured:', !!SUPABASE_ANON_KEY, SUPABASE_ANON_KEY ? '(key present)' : '(empty)');
console.log('Supabase URL defined:', !!SUPABASE_URL);
console.log('Supabase Anon Key defined:', !!SUPABASE_ANON_KEY);
console.log('All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));

// Create a dummy client if env vars are missing (for development/preview purposes)
// This prevents the app from crashing before the secrets are properly loaded
let supabase: SupabaseClient;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.');
  // Create a placeholder - operations will fail gracefully
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { supabase };
export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
