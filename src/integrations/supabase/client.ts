import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These are publishable keys - safe to include in frontend code
const SUPABASE_URL = 'https://bsloebohbsepdfoldsud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbG9lYm9oYnNlcGRmb2xkc3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4OTc2NjAsImV4cCI6MjAyMjQ3MzY2MH0';

// Note: The anon key above is truncated from your screenshot. 
// Please update it with the FULL anon key from your Supabase dashboard.

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;
