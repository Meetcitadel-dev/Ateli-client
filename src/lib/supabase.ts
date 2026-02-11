import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('SUPABASE CONFIG ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing!');
    console.log('Current Env:', import.meta.env);
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
