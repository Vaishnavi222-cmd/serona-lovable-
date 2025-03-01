
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
    storageKey: 'sb-session', // Explicit storage key
    flowType: 'pkce', // More secure authentication flow
    debug: true
  }
});

// Enhanced debug listener for auth state changes with more detailed session info
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
        metadata: session.user.user_metadata,
        authProvider: session.user.app_metadata?.provider,
        rawUserObject: session.user // Added full user object for debugging
      } : null,
      expiresAt: session?.expires_at,
      rawSession: session // Added full session object for debugging
    }
  });
});

// Enhanced helper function to get current user with more detailed logging
export const getCurrentUser = async () => {
  console.log("🔍 DEBUG - getCurrentUser started");
  
  // First try to refresh the session
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
  
  console.log("🔄 DEBUG - Session refresh attempt:", {
    success: !refreshError,
    error: refreshError,
    hasSession: refreshData?.session ? true : false,
    sessionDetails: refreshData?.session ? {
      user: refreshData.session.user ? {
        id: refreshData.session.user.id,
        email: refreshData.session.user.email,
        metadata: refreshData.session.user.user_metadata,
        rawUser: refreshData.session.user // Added full user object for debugging
      } : null,
      rawSession: refreshData.session // Added full session object for debugging
    } : null
  });

  if (refreshError) {
    console.error("❌ Session refresh error:", refreshError);
  }
  
  // Get the fresh session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  console.log("🔍 DEBUG - Fresh session check:", {
    hasSession: session ? true : false,
    error: sessionError,
    sessionDetails: session ? {
      hasUser: session.user ? true : false,
      hasEmail: session.user?.email ? true : false,
      userDetails: session.user ? {
        id: session.user.id,
        email: session.user.email,
        hasEmailVerified: session.user.email_confirmed_at ? true : false,
        hasUserMetadata: session.user.user_metadata ? true : false,
        metadata: session.user.user_metadata,
        rawUser: session.user // Added full user object for debugging
      } : null,
      rawSession: session // Added full session object for debugging
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
      metadata: session.user.user_metadata,
      rawUser: session.user // Added full user object for debugging
    });
    return { user: null, error: new Error("No email in user data") };
  }

  console.log("✅ User retrieved successfully:", {
    id: session.user.id,
    email: session.user.email,
    hasEmailVerified: session.user.email_confirmed_at ? true : false,
    metadata: session.user.user_metadata,
    rawUser: session.user // Added full user object for debugging
  });

  return { user: session.user, error: null };
};

