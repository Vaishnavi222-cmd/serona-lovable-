
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          content: "I apologize, but there seems to be a configuration issue. Please try again later.",
          error: "Configuration error" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body first to fail fast if invalid
    const { content, chat_session_id } = await req.json();

    if (!content || !chat_session_id) {
      return new Response(
        JSON.stringify({ 
          content: "I couldn't process that message. Please try again.",
          error: "Missing required fields" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          content: "Please sign in to continue the conversation.",
          error: "Authentication required" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing message:', {
      chatId: chat_session_id,
      userId: user.id,
      contentLength: content.length
    });

    // Since OpenAI is not configured yet, use a placeholder response
    const aiResponse = {
      content: "Hello! I'm currently in development mode and can't provide detailed responses yet. Once the AI integration is complete, I'll be able to help you better! 😊",
      role: "assistant"
    };

    // Save AI response to database
    const { data: savedResponse, error: saveError } = await supabase
      .from('messages')
      .insert({
        chat_session_id,
        content: aiResponse.content,
        user_id: user.id,
        sender: 'ai'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving AI response:', saveError);
      return new Response(
        JSON.stringify({ 
          content: "I received your message but couldn't save my response. Please try again.",
          error: "Database error" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('AI response saved successfully:', {
      messageId: savedResponse.id,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        content: aiResponse.content,
        message: savedResponse
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in process-message function:', error);
    return new Response(
      JSON.stringify({ 
        content: "I encountered an unexpected error. Please try again.",
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
