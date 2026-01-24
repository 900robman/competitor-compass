import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
