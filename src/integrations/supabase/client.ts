
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    detectSessionInUrl: true,
    debug: true
  }
});

// Enhanced debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔄 DEBUG - Auth state changed:", {
    event,
    timestamp: new Date().toISOString(),
    hasSession: session ? true : false,
    hasUser: session?.user ? true : false,
    hasEmail: session?.user?.email ? true : false,
    sessionDetails: {
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        hasEmailVerified: session.user.email_confirmed_at ? true : false,
        hasUserMetadata: session.user.user_metadata ? true : false,
        authProvider: session.user.app_metadata?.provider,
      } : null,
      expiresAt: session?.expires_at,
    }
  });
});

// Enhanced helper function to get current user with email validation
export const getCurrentUser = async () => {
  console.log("🔍 DEBUG - getCurrentUser started");
  
  // First try to refresh the session
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  if (refreshError) {
    console.error("❌ Session refresh error:", refreshError);
  } else {
    console.log("✅ Session refreshed successfully:", {
      hasUser: refreshData.session?.user ? true : false,
      hasEmail: refreshData.session?.user?.email ? true : false
    });
  }
  
  // Get the fresh session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  console.log("🔍 DEBUG - Session check:", {
    hasSession: session ? true : false,
    error: sessionError,
    sessionDetails: session ? {
      hasUser: session.user ? true : false,
      hasEmail: session.user?.email ? true : false,
      userDetails: session.user ? {
        id: session.user.id,
        email: session.user.email,
        hasEmailVerified: session.user.email_confirmed_at ? true : false,
        hasUserMetadata: session.user.user_metadata ? true : false
      } : null
    } : null
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
    console.error("❌ No email in user data:", {
      user: session.user,
      metadata: session.user.user_metadata
    });
    return { user: null, error: new Error("No email in user data") };
  }

  console.log("✅ User retrieved successfully:", {
    id: session.user.id,
    email: session.user.email,
    hasEmailVerified: session.user.email_confirmed_at ? true : false
  });

  return { user: session.user, error: null };
};
