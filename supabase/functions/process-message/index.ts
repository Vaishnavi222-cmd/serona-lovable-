
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 Process Message Function Started', {
    timestamp: new Date().toISOString(),
    method: req.method
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication Error:', {
        error: authError,
        timestamp: new Date().toISOString()
      });
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // Parse request body
    const { content, chat_session_id } = await req.json();

    if (!content || !chat_session_id) {
      console.error('❌ Validation Error: Missing required fields');
      throw new Error('Missing required fields');
    }

    console.log('📝 Inserting message:', {
      chatSessionId: chat_session_id,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // Insert message
    const { data: message, error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        content,
        chat_session_id,
        user_id: user.id,
        sender: 'user',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database Error:', {
        error: insertError,
        timestamp: new Date().toISOString()
      });
      throw insertError;
    }

    console.log('✅ Message inserted successfully:', {
      messageId: message.id,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        message: 'Message processed successfully',
        data: message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error processing message:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
