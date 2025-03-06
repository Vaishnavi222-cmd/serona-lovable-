import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

console.log('🚀 Process Message Function Started');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('📥 New request received:', {
    method: req.method,
    url: req.url,
    hasAuthorization: !!req.headers.get('Authorization'),
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('👉 Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    // Check environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Log environment variables status (without revealing values)
    console.log('🔑 Environment variables check:', {
      hasOpenAIKey: !!openAIApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      timestamp: new Date().toISOString()
    });

    if (!openAIApiKey || !supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!openAIApiKey) missingVars.push('OPENAI_API_KEY');
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
      
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      console.error('❌', error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the JWT token
    console.log('🔒 Verifying JWT token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('✅ User authenticated:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📝 Parsed request body:', {
        hasContent: !!requestBody.content,
        hasChatSessionId: !!requestBody.chat_session_id
      });
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { content, chat_session_id } = requestBody;
    
    if (!content || !chat_session_id) {
      const error = 'Missing required fields';
      console.error('❌', error, { content: !!content, chat_session_id: !!chat_session_id });
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get conversation history
    console.log('📚 Fetching message history for chat:', chat_session_id);
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('content, sender')
      .eq('chat_session_id', chat_session_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('❌ Error fetching message history:', historyError);
      return new Response(JSON.stringify({ error: 'Failed to fetch message history' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('📚 Message history fetched, count:', messageHistory?.length || 0);

    // Create messages array for OpenAI
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
- Avoid generic advice - always personalize based on the individual
- Guide off-topic discussions back to personal development
- Remember: Help users understand themselves better through insightful analysis while maintaining a supportive, professional, and ethical approach.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(messageHistory || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content }
    ];

    // Prepare OpenAI request
    const openAIBody = {
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    console.log('🚀 Preparing OpenAI request:', {
      model: openAIBody.model,
      messageCount: messages.length,
      temperature: openAIBody.temperature,
      max_tokens: openAIBody.max_tokens
    });

    // Make request to OpenAI
    console.log('📤 Sending request to OpenAI...');
    let openAIResponse;
    try {
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(openAIBody)
      });

      console.log('📥 Received response from OpenAI:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        ok: openAIResponse.ok
      });
    } catch (error) {
      console.error('❌ Network error calling OpenAI:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to OpenAI API'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI API Error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        error: errorText
      });
      
      let errorMessage = 'Failed to get response from AI';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }

      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${errorMessage}` 
      }), {
        status: openAIResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse OpenAI response
    let aiData;
    try {
      aiData = await openAIResponse.json();
      console.log('✅ Successfully parsed OpenAI response');
    } catch (error) {
      console.error('❌ Failed to parse OpenAI response:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid response format from OpenAI'
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      console.error('❌ Invalid OpenAI response format:', aiData);
      return new Response(JSON.stringify({ error: 'Invalid response from OpenAI' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const aiResponse = aiData.choices[0].message.content;
    console.log('✅ Successfully processed OpenAI response');

    return new Response(JSON.stringify({ content: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
