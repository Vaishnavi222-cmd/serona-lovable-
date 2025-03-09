
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { content, chat_session_id } = await req.json();

    // Get current date for usage tracking
    const currentDate = new Date().toISOString().split('T')[0];

    // Get or create daily usage record
    const { data: dailyUsage, error: usageError } = await supabaseClient
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', currentDate)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }

    // Check active plan
    const { data: activePlan } = await supabaseClient
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no active paid plan, enforce free plan limits
    if (!activePlan) {
      const responses_count = (dailyUsage?.responses_count || 0) + 1;
      
      if (responses_count > 7) {
        return new Response(
          JSON.stringify({
            error: 'Daily response limit exceeded',
            limitReached: true,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update daily usage before processing to ensure limit is respected
      await supabaseClient
        .from('user_daily_usage')
        .upsert({
          user_id: user.id,
          date: currentDate,
          responses_count: responses_count,
          last_usage_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('date', currentDate);
    }

    // OpenAI Request with non-streaming
    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are Serona AI, a personal AI companion for growth and guidance. You provide personalized support for deep personality analysis, career guidance, and more. You are designed to understand the user and guide them forward. You are friendly, helpful, and encouraging. You are not a therapist, so do not give therapy advice. You are not a financial advisor, so do not give financial advice. You are not a doctor, so do not give medical advice. You are not a lawyer, so do not give legal advice. You are not a substitute for professional help.`,
            },
            { role: 'user', content: content },
          ],
          stream: false,
          max_tokens: 800,
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const responseData = await openAIResponse.json();
      const aiResponse = responseData.choices[0].message.content;

      // Calculate token usage
      const inputTokens = Math.ceil(content.length / 4); // Approximate token count
      const outputTokens = Math.ceil(aiResponse.length / 4); // Approximate token count

      // Update usage statistics
      await supabaseClient
        .from('user_daily_usage')
        .upsert({
          user_id: user.id,
          date: currentDate,
          responses_count: (dailyUsage?.responses_count || 0) + 1,
          input_tokens_used: (dailyUsage?.input_tokens_used || 0) + inputTokens,
          output_tokens_used: (dailyUsage?.output_tokens_used || 0) + outputTokens,
          last_usage_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('date', currentDate);

      // Save AI message to database
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_session_id: chat_session_id,
          content: aiResponse,
          user_id: user.id,
          sender: 'ai'
        });

      if (messageError) {
        console.error('Error saving AI message:', messageError);
        throw messageError;
      }

      return new Response(
        JSON.stringify({ content: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('OpenAI error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
