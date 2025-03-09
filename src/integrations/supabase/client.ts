import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ptpxhzfjfssaxilyuwzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cHhoemZqZnNzYXhpbHl1d3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjQ1MDUsImV4cCI6MjA1NDYwMDUwNX0.IlH5fNAwIS3H_D3zeaR90mrYjtHFc55B1nSFGBQPwcQ";

// Cache the session in memory
let cachedSession: any = null;

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

// Enhanced debug listener for auth state changes with session caching
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event);
  
  if (session) {
    cachedSession = session;
  }

  if (event === 'SIGNED_IN' && session?.user) {
    initializeDailyUsage(session.user.id).catch(error => {
      console.error("Background task error:", error);
    });
  }
});

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

// Enhanced helper function to get current user with session caching
export const getCurrentUser = async () => {
  console.log("🔍 DEBUG - getCurrentUser started");
  
  try {
    // First try to use cached session
    if (cachedSession?.user) {
      console.log("✅ Using cached session");
      return { user: cachedSession.user, error: null };
    }

    // If no cached session, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("❌ Session refresh error:", refreshError);
      // Don't throw error here - try getting session first
    }

    if (refreshData?.session) {
      cachedSession = refreshData.session;
      console.log("✅ Session refreshed successfully");
      return { user: refreshData.session.user, error: null };
    }

    // Last resort - get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      cachedSession = session;
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
