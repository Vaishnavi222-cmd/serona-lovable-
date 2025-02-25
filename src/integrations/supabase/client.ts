
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

// Initialize the Supabase client with specific options and fetch retry
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage, // Explicitly set storage
    storageKey: 'supabase.auth.token', // Explicitly set storage key
  },
  global: {
    fetch: (...args) => {
      const [url, config] = args;
      return fetch(url, {
        ...config,
        credentials: 'include', // Always include credentials
      });
    },
  },
});

// Enhanced debug listener for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("Auth state changed:", event);
  console.log("Session full details:", {
    session,
    user: session?.user,
    email: session?.user?.email,
    id: session?.user?.id,
    aud: session?.user?.aud,
    timestamp: new Date().toISOString()
  });

  // Verify session validity
  if (event === 'SIGNED_IN') {
    const { data: { session: currentSession }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session verification error:", error);
      return;
    }
    if (!currentSession?.user?.email) {
      console.error("Session missing email after sign in");
      return;
    }
    console.log("Session verified with email:", currentSession.user.email);
  }
});

// Export a helper function to validate session
export const validateAndRefreshSession = async () => {
  try {
    // First try to refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.user?.email) {
      throw new Error("No email found in session");
    }

    return {
      valid: true,
      session,
      user: session.user,
      error: null
    };
  } catch (error) {
    console.error("Session validation failed:", error);
    return {
      valid: false,
      session: null,
      user: null,
      error
    };
  }
};
