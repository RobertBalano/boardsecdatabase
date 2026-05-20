import { createClient } from '@supabase/supabase-js';

// Grab the environment variables we defined in step 1
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throw a helpful error if you forgot to set up your keys
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env file');
}

// Initialize and export the client single instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);