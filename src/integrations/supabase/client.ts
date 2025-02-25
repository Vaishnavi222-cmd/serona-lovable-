
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage
  }
});

// Debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔎 DEBUG: Auth state changed:", event);
  console.log("🔎 DEBUG: Session:", {
    session,
    user: session?.user,
    email: session?.user?.email,
    timestamp: new Date().toISOString()
  });
});

// Helper function to get current user with email validation
export const getCurrentUser = async () => {
  // First try to get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  console.log("🔎 DEBUG: getCurrentUser - Session check:", {
    session,
    error: sessionError,
    hasEmail: session?.user?.email ? true : false
  });

  if (sessionError) {
    console.error("❌ Session error:", sessionError);
    return { user: null, error: sessionError };
  }

  if (!session?.user) {
    console.error("❌ No user in session");
    return { user: null, error: new Error("No user in session") };
  }

  if (!session.user.email) {
    console.error("❌ No email in user data");
    return { user: null, error: new Error("No email in user data") };
  }

  // Explicitly verify user data
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  console.log("🔎 DEBUG: getCurrentUser - User verification:", {
    user,
    error: userError,
    hasEmail: user?.email ? true : false
  });

  if (userError || !user?.email) {
    console.error("❌ User verification failed:", userError);
    return { user: null, error: userError || new Error("User verification failed") };
  }

  return { user, error: null };
};
