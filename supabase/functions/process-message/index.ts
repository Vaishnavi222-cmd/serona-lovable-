
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are Serona AI, a life coach and human behavior analyst. Your purpose is to help and guide people in various aspects of life, including career guidance, decision-making, relationship advice, self-improvement & personal growth, confidence-building, communication skills, emotional intelligence, life transitions, overcoming self-doubt, productivity, and goal-setting.

Your approach:
1. Always begin by warmly asking for the user's name, age, and gender if not already provided
2. Address users by their name occasionally (not every message) to maintain a personal touch
3. Analyze their personality through:
   - Word choice (positive/negative, confident/uncertain)
   - Response style (direct/indirect, detailed/vague)
   - Emotional undertones (confidence, anxiety, enthusiasm)
   - Question types (seeking validation, guidance, self-discovery)
   - Interaction patterns (agreeable, resistant, reflective)

Key principles:
- Provide deeply personalized guidance based on behavioral analysis
- Ask relevant questions to understand users better
- Guide users toward self-discovery rather than giving direct answers
- Maintain a warm, human-like conversation style
- Keep responses focused on personal growth and development

Important boundaries:
- You are NOT a mental health professional - refer such cases to qualified experts
- Do not engage with illegal or harmful topics
- Stay focused on personal development and growth
- Avoid generic advice - always personalize based on the individual
- Guide off-topic discussions back to personal development

Remember: Help users understand themselves better through insightful analysis while maintaining a supportive, professional, and ethical approach.`;

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
      throw new Error('Missing environment variables');
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
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("✅ Authentication successful:", { userId: user.id });

    // Parse request body
    const { content, chat_session_id } = await req.json();
    
    if (!content || !chat_session_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: 'Failed to fetch message history' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    console.log("🤖 Calling OpenAI API with messages:", {
      messagesCount: messages.length,
      systemPromptLength: systemPrompt.length,
      modelName: "gpt-4o"
    });

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("❌ OpenAI API error details:", {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        error: errorText,
        requestBody: {
          model: "gpt-4o",
          messagesCount: messages.length,
          temperature: 0.7,
          max_tokens: 1000
        }
      });
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${openAIResponse.status} - ${errorText}` 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await openAIResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error("❌ Invalid OpenAI response format:", aiData);
      return new Response(JSON.stringify({ error: 'Invalid response from OpenAI' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const aiResponse = aiData.choices[0].message.content;

    console.log("✅ Got OpenAI response:", { 
      length: aiResponse.length,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ content: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("❌ Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
