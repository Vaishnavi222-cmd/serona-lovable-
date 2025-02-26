
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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[Auth Error]:', {
        error: authError,
        message: authError?.message || 'No user found',
        timestamp: new Date().toISOString()
      });
      throw new Error('Unauthorized: ' + (authError?.message || 'No user found'));
    }

    // Parse request body
    const requestBody = await req.json();
    console.log('[Request] Body:', {
      hasContent: !!requestBody.content,
      hasChatSessionId: !!requestBody.chat_session_id,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!requestBody.content || !requestBody.chat_session_id) {
      console.error('[Validation Error] Missing required fields');
      throw new Error('Missing required fields: content and chat_session_id are required');
    }

    // Insert message
    console.log('[DB] Attempting to insert message');
    const { data, error } = await supabaseClient
      .from("messages")
      .insert([
        {
          sender: "user",
          content: requestBody.content,
          chat_session_id: requestBody.chat_session_id,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("[DB Error] Error inserting message:", {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to insert message: ' + error.message);
    }

    console.log('[Success] Message inserted:', {
      messageId: data?.id,
      timestamp: new Date().toISOString()
    });

    // Success response
    return new Response(
      JSON.stringify({ 
        status: 'success',
        data,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('=== ERROR IN REQUEST PROCESSING ===', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: error.constructor.name
    });

    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
