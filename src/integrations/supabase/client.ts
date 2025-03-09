import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

// Cache the session in memory and localStorage
let cachedSession: any = null;

// Try to load initial session from localStorage with validity check
try {
  const storedSession = localStorage.getItem('sb-session');
  if (storedSession) {
    const parsedSession = JSON.parse(storedSession);
    // Check if session is expired
    const expiresAt = parsedSession.expires_at;
    if (expiresAt && new Date(expiresAt * 1000) > new Date()) {
      console.log("✅ Using valid cached session");
      cachedSession = parsedSession;
    } else {
      console.log("⚠️ Cached session expired, clearing...");
      localStorage.removeItem('sb-session');
      cachedSession = null;
    }
  }
} catch (error) {
  console.error("Error loading stored session:", error);
  localStorage.removeItem('sb-session');
  cachedSession = null;
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    detectSessionInUrl: true,
    storageKey: 'sb-session',
    flowType: 'pkce',
    debug: true
  }
});

// Enhanced debug listener for auth state changes with improved session persistence
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event, session?.user?.email);
  
  if (session) {
    try {
      localStorage.setItem('sb-session', JSON.stringify(session));
      cachedSession = session;
      
      if (event === 'SIGNED_IN') {
        initializeDailyUsage(session.user.id).catch(error => {
          console.error("Background task error:", error);
        });
      }
    } catch (error) {
      console.error("Error saving session:", error);
    }
  } else {
    localStorage.removeItem('sb-session');
    cachedSession = null;
  }
});

// Enhanced getCurrentUser with better session handling
export const getCurrentUser = async () => {
  console.log("🔍 DEBUG - getCurrentUser started");
  
  try {
    // First try to use cached session
    if (cachedSession?.user) {
      // Validate cached session expiry
      const expiresAt = cachedSession.expires_at;
      if (expiresAt && new Date(expiresAt * 1000) > new Date()) {
        console.log("✅ Using valid cached session");
        return { user: cachedSession.user, error: null };
      }
      console.log("⚠️ Cached session expired, refreshing...");
    }

    // Try to refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshData?.session) {
      cachedSession = refreshData.session;
      localStorage.setItem('sb-session', JSON.stringify(refreshData.session));
      console.log("✅ Session refreshed successfully");
      return { user: refreshData.session.user, error: null };
    }

    if (refreshError) {
      console.error("❌ Session refresh error:", refreshError);
      // Clear invalid session data
      localStorage.removeItem('sb-session');
      cachedSession = null;
      return { user: null, error: refreshError };
    }

    // Last resort - get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      cachedSession = session;
      localStorage.setItem('sb-session', JSON.stringify(session));
      console.log("✅ Got current session");
      return { user: session.user, error: null };
    }

    console.log("❌ No valid session found");
    return { user: null, error: new Error("No valid session found") };
  } catch (error) {
    console.error("❌ Error in getCurrentUser:", error);
    return { user: null, error };
  }
};

// Separate function to handle daily usage initialization
async function initializeDailyUsage(userId: string) {
  try {
    const todayDate = new Date().toISOString().split('T')[0];
    
    const { data: existingUsage, error: checkError } = await supabase
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing usage:", checkError);
      return;
    }

    if (!existingUsage) {
      const { error: insertError } = await supabase
        .from('user_daily_usage')
        .insert([{
          user_id: userId,
          date: todayDate,
          responses_count: 0,
          output_tokens_used: 0,
          input_tokens_used: 0,
          last_usage_time: new Date().toISOString()
        }]);

      if (insertError) {
        console.error("Error creating daily usage record:", insertError);
      }
    }
  } catch (error) {
    console.error("Unexpected error in daily usage tracking:", error);
  }
}
