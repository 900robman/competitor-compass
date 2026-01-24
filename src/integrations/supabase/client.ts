import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These are publishable keys - safe to include in frontend code
const SUPABASE_URL = 'https://bsloebohbsepdfoldsud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbG9lYm9oYnNlcGRmb2xkc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODk0ODUsImV4cCI6MjA4NDc2NTQ4NX0.VnotHm2o-X0UCa6m-yKZA_cYzokKc8Qrxvpu-kZl0gU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;
