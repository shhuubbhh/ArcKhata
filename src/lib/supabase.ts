import { createClient } from "@supabase/supabase-js";

// Hardcoded fallbacks to ensure the app works on Vercel even if env vars are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://nmzrisimklgkzdpwnoxt.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tenJpc2lta2xna3pkcHdub3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDc5ODYsImV4cCI6MjA5MzkyMzk4Nn0.nKBozwtZ1nU8j44VOtm91C5nmgmXq0yhcBA_Kwlmri4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



