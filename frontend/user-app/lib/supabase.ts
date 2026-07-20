import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

// ─────────────────────────────────────────────────────
// Supabase Client — requires env vars.
//
// Set these in your .env file:
//   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
//
// See .env.example for template.
// ─────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase public credentials');
}

export const IS_STUB_MODE = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
