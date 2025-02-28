
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
      throw new Error('Missing Supabase environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { content, chat_session_id } = await req.json();

    if (!content || !chat_session_id) {
      throw new Error('Missing required fields');
    }

    console.log('Processing message:', {
      chatId: chat_session_id,
      userId: user.id,
      contentLength: content.length
    });

    // Generate AI response (placeholder for now)
    const aiResponse = {
      content: "I'm here to help! However, I notice that the AI integration is not yet complete. This is a placeholder response. Please set up the OpenAI API key to enable full AI functionality.",
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
      throw saveError;
    }

    console.log('AI response saved successfully:', {
      messageId: savedResponse.id,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      content: aiResponse.content,
      message: savedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in process-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
