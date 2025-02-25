
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

// Initialize the Supabase client with specific options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});

// Add a debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  console.log("Session:", session);
});
