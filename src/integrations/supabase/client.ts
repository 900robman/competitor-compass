import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// These are publishable keys - safe to include in frontend code
// IMPORTANT: Update the SUPABASE_ANON_KEY with your full anon key from Supabase dashboard
const SUPABASE_URL = 'https://bsloebohbsepdfoldsud.supabase.co';

// Placeholder - REPLACE THIS with your full anon key
const SUPABASE_ANON_KEY = 'YOUR_FULL_ANON_KEY_HERE';

let supabase: SupabaseClient;
let isSupabaseConfigured = false;

try {
  if (SUPABASE_ANON_KEY === 'YOUR_FULL_ANON_KEY_HERE') {
    console.warn('Supabase anon key not configured. Please update src/integrations/supabase/client.ts with your anon key.');
    // Create a placeholder client that won't work but won't crash
    supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
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
    isSupabaseConfigured = true;
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a placeholder client
  supabase = createClient('https://placeholder.supabase.co', 'placeholder', {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { supabase, isSupabaseConfigured };
