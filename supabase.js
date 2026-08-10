import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables dynamically to prevent Rollup static tree-shaking
const env = import.meta.env;
const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'] || '';

// Verify configuration presence
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Initialize client safely if configuration is present
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
