
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Initial request logging
  console.log('=== START REQUEST PROCESSING ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request details:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // CORS handling
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Environment check
    console.log('[ENV Check] Supabase URL:', !!Deno.env.get('SUPABASE_URL'));
    console.log('[ENV Check] Service Role Key:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Client initialization
    console.log('[Setup] Initializing Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    console.log('[Setup] Supabase client initialized');

    // Authentication
    console.log('[Auth] Getting user from token');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('[Auth Error]:', {
        error: authError,
        message: authError.message,
        timestamp: new Date().toISOString()
      });
      throw new Error('Unauthorized: ' + authError.message);
    }

    if (!user) {
      console.error('[Auth Error] No user found in context');
      throw new Error('User not found in auth context');
    }

    console.log('[Auth Success] User authenticated:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Request body parsing
    console.log('[Request] Parsing request body');
    const { prompt } = await req.json();
    console.log('[Request] Prompt received:', {
      promptExists: !!prompt,
      promptLength: prompt?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Processing message
    console.log('[Processing] Starting message processing');
    
    // Add your message processing logic here
    
    console.log('[Processing] Message processed successfully');

    // Success response
    console.log('=== END REQUEST PROCESSING ===');
    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: "Message processed successfully",
        userId: user.id,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID() // Add a unique ID for tracking
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        } 
      }
    );
  } catch (error) {
    // Error logging
    console.error('=== ERROR IN REQUEST PROCESSING ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: error.constructor.name,
      details: error.toString()
    });

    // Error response
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        details: error.toString()
      }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        }
      }
    );
  }
});
