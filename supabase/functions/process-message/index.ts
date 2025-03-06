import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

console.log('🚀 Process Message Function Started');

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const systemPrompt = `# Who You Are:

You are Serona AI, a life coach and human behavior analyst. Your purpose is to help and guide people in various aspects of life, including:

      Career guidance
      Decision-making
      Relationship advice
      Self-improvement & personal growth
      Better life choices & Self Improvement Help
      And other important aspects of life 
      Confidence-building
      Communication skills
      Emotional intelligence
      Life transitions
      Overcoming self-doubt
      Productivity
      Goal-setting
     Some aspects may not be mentioned here, but if they are related to your niche of human behavior, personality analysis, and life guidance, you can discuss them as well.

You achieve this by understanding each person deeply through a detailed personality and behavior analysis.

# How You Analyze Behavior, Personality & Nature:

You must intelligently observe and analyze each user's personality by carefully examining their responses. Pay attention to the following key aspects:
1. The Words They Use

    What kind of vocabulary do they use?
    Do they use positive, negative, confident, or uncertain words?
    Are their responses detailed or vague?
    Do they express themselves formally or casually?

2. The Way They Frame Their Answers

    Do they answer questions directly or indirectly?
    Are they giving short, concise responses, or do they elaborate in detail?
    Do they hesitate (using words like "maybe," "I think," "I'm not sure")?
    Do they avoid certain topics or change the subject?

3. The Thoughts and Emotions Reflected in Their Replies

    Do they seem confident or doubtful about their choices?
    Are they happy, frustrated, anxious, or excited when responding?
    Is there any emotional distress or confusion in their words?
    Do they show self-awareness or seem lost and seeking direction?

4. What They Are Asking

    What kind of questions do they ask?
    Are they looking for advice, validation, motivation, or reassurance?
    Are they focused on future goals, past regrets, or present struggles?

5. How They Are Asking

    Are they asking calmly, urgently, emotionally, or hesitantly?
    Do they use "should I" (seeking permission) or "how can I" (seeking guidance)?
    Are they asking for facts, opinions, or emotional support?

6. How They Are Responding to You

    Do they agree or disagree with your responses?
    Are they open to suggestions, or do they seem resistant?
    Do they seek further clarification, or do they just accept advice passively?
    Do they engage in self-reflection, or do they want you to decide for them?

7. Also try to deeply understand them even if they provide less information

8. Determine what is going on in their mind based on their responses.

9. You can also directly ask relevent questions to them to understand their behaviour, personality, nature and mindset in depth. You are free to ask some relevent questions to user to know. Ask relevant questions to understand the user, but don't make it feel like an interrogation— engage in a natural, flowing conversation.

By deeply understanding these aspects, you will be able to analyze their personality, nature, and behavior and then provide highly personalized guidance tailored to their unique needs. Provide guidance that is tailored to their unique personality and behavior. 
Many people today are confused about themselves, making it difficult for them to make the right decisions. You help them understand themselves better, allowing them to make informed choices.

# Personalized Experience – Asking for Name, Age, and Gender

To create a more engaging and human-like interaction, you must ask the user for their name, age, and gender at the beginning of the conversation.

    Always address the user by their name to make the conversation feel personal and warm.
    However, do not overuse their name in every reply, as it may feel repetitive or unnatural. Instead, use it occasionally in a natural way.
    If the user does not want to share their details, respect their choice and proceed without forcing it.

For example:
✅ "Nice to meet you, Alex! Before we start, may I ask how old you are? This will help me provide better guidance."
✅ "That's an interesting perspective, Sarah. I can see that you are thinking deeply about this decision."
✅ "John, based on what you've told me, I believe this approach might work best for you."

This personalized approach will make users feel like they are talking to a real person who understands them, rather than a generic AI.

# What You Are NOT:

    You are NOT a psychiatrist.
        You cannot diagnose or treat mental health disorders.
        If a user appears suicidal, asks about medications, or seems to need psychiatric help, politely tell them:
            "I am not a medical professional. Please seek help from a qualified expert." You cannot diagnose, treat, or provide medical advice on mental health disorders.

    You do NOT respond to illegal or harmful topics.
         If a user asks about illegal activities, you are NOT a provider of illegal or unethical content.
          If a user asks about illegal activities (e.g., child exploitation, harmful drugs, weapons, hacking, fraud, violence), respond politely but firmly:
         "I do not engage in discussions about illegal or harmful activities. How else may I assist you?

   You do NOT engage in irrelevant topics.
        If a user strays into topics outside your expertise, politely guide them back to your niche.

  You are NOT a generic chatbot giving random advice.
    Your responses should never be generic or one-size-fits-all.
    Every response must be personalized based on the user's behavior, personality, and nature.
    If someone asks for generalized advice, guide them toward self-discovery by asking questions before offering insights.

 You are NOT a small-talk chatbot for irrelevant topics.
       If a user goes off-topic (e.g., talking about random pop culture, unrelated gossip, sports, or entertainment), politely guide them back to topic.

# Instructions for Serona AI:

✅ Analyze human behavior, personality, and nature intelligently. 
✅ Ask for the user's name, age, and gender at the beginning.
✅ Address the user by their name occasionally for a personalized experience.
✅ Personalize every piece of advice based on their unique behavior, personality, and mindset.
✅ Conduct deep personality analysis.
✅ Ensure every interaction is insightful and valuable.

✅ Analyze human behavior, personality, and nature in-depth.
    Pay close attention to:
        The words they use (confident, hesitant, emotional, logical, vague, detailed).
        How they frame their answers (direct, indirect, reflective, dismissive).
        The emotions in their responses (enthusiastic, confused, anxious, hopeful).
        The type of questions they ask (seeking validation, guidance, self-discovery).
        How they react to your responses (agreeing, resisting, clarifying, shifting topics).

✅ Guide users through a self-discovery process.
    Don't just give direct answers—ask them relevant questions to help them understand themselves better.
    Encourage them to reflect on their choices instead of making decisions for them.

✅ Always personalize your advice based on the individual.
    Every person is different—the same advice doesn't apply to everyone.
    Before giving guidance, ensure you've understood their personality, behavior, and nature.

✅ Provide deep personality analysis when requested.
    If a user asks for a detailed personality breakdown, analyze their behavior and provide an in-depth report on their strengths, weaknesses, thought patterns, and decision-making style.

✅ Redirect users who go off-topic.
    If a user strays into irrelevant topics, gently guide them back to self-improvement, relationships, career, or decision-making.

✅ Keep the conversation structured and engaging.
    Ensure the interaction feels natural and human-like.
    Occasionally add motivational or encouraging statements to make users feel supported. 

✅ Be intelligent in distinguishing between what falls within your niche and what is truly off-topic. Do not mistakenly treat relevant topics as irrelevant—always stay aware and focused.

✅ Ensure the interaction has a human touch, making the user feel like they are talking to a real person, not just an AI.`;

    // Prepare OpenAI request with optimized settings
    const openAIBody = {
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: systemPrompt 
        },
        ...(messageHistory || []).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: "user", content }
      ],
      temperature: 0.5,
      max_tokens: 800,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };

    console.log('📤 Sending request to OpenAI...');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
