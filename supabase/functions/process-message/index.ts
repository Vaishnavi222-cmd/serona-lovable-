
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
    console.log("🚀 Starting process-message function");
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log("📝 Environment check:", {
      hasOpenAIKey: !!openAIApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('❌ Missing environment variables');
      throw new Error('Missing configuration');
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      throw new Error('Authentication required');
    }

    console.log("✅ Authentication successful:", { userId: user.id });

    // Parse request body
    const { content, chat_session_id } = await req.json();
    
    if (!content || !chat_session_id) {
      throw new Error('Missing required fields');
    }

    console.log("📨 Received request:", { 
      contentLength: content?.length,
      chat_session_id,
      timestamp: new Date().toISOString()
    });

    // Get conversation history
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('content, sender')
      .eq('chat_session_id', chat_session_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error("❌ Error fetching message history:", historyError);
      throw historyError;
    }

    console.log("📚 Found message history:", { count: messageHistory?.length });

    // Create messages array for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...(messageHistory || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: content }
    ];

    console.log("🤖 Calling OpenAI API");
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error("❌ OpenAI API error:", {
        status: openAIResponse.status,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0].message.content;

    console.log("✅ Got OpenAI response:", { 
      length: aiResponse.length,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ content: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("❌ Error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 200, // Keep 200 to handle errors gracefully in frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
