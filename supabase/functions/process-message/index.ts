
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize conversation context to track user details across messages
const conversationContext = new Map();

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

    // Log environment setup
    console.log("📝 Environment check:", {
      hasOpenAIKey: !!openAIApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          content: "Configuration error. Please try again later.",
          error: "Missing configuration" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { content, chat_session_id } = await req.json();
    console.log("📨 Received request:", { 
      contentLength: content?.length,
      chat_session_id,
      timestamp: new Date().toISOString()
    });

    if (!content || !chat_session_id) {
      console.error("❌ Missing required fields:", { content, chat_session_id });
      return new Response(
        JSON.stringify({ 
          content: "Missing required information. Please try again.",
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
    console.log("👤 Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          content: "Please sign in to continue.",
          error: "Authentication required" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get conversation history
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('content, sender')
      .eq('chat_session_id', chat_session_id)
      .order('created_at', { ascending: true });

    console.log("📚 Message history:", {
      messageCount: messageHistory?.length,
      historyError: historyError?.message
    });

    if (historyError) {
      console.error('❌ Error fetching message history:', historyError);
    }

    // Create messages array for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...(messageHistory || []).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: content }
    ];

    console.log("🤖 Preparing OpenAI request:", {
      messageCount: messages.length,
      lastMessageContent: content.substring(0, 50) + "..."
    });

    // Call OpenAI API
    try {
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

      console.log("📡 OpenAI API response status:", {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error("❌ OpenAI API error:", {
          status: openAIResponse.status,
          statusText: openAIResponse.statusText,
          errorData
        });
        throw new Error(`OpenAI API error: ${openAIResponse.statusText}\n${errorData}`);
      }

      const aiData = await openAIResponse.json();
      console.log("✅ OpenAI API success:", {
        hasChoices: !!aiData.choices,
        choicesLength: aiData.choices?.length,
        firstChoiceLength: aiData.choices?.[0]?.message?.content?.length
      });

      const aiResponse = aiData.choices[0].message.content;

      // Save AI response to database
      const { data: savedResponse, error: saveError } = await supabase
        .from('messages')
        .insert({
          chat_session_id,
          content: aiResponse,
          user_id: user.id,
          sender: 'ai'
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving AI response:', saveError);
        return new Response(
          JSON.stringify({ 
            content: "Message received but couldn't be saved. Please try again.",
            error: "Database error" 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log("💾 Saved response to database:", {
        responseId: savedResponse?.id,
        timestamp: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({ 
          content: aiResponse,
          message: savedResponse
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (openAIError) {
      console.error('❌ Error in OpenAI API call:', {
        error: openAIError.message,
        stack: openAIError.stack
      });
      throw openAIError;
    }

  } catch (error) {
    console.error('❌ Error in process-message function:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return new Response(
      JSON.stringify({ 
        content: "An unexpected error occurred. Please try again.",
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
