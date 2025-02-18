
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user ID from the auth token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { prompt, requiresDetailedResponse } = await req.json();

    // Check user's plan status
    const { data: activePlan } = await supabaseClient
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get today's usage for free plan
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyUsage, error: dailyUsageError } = await supabaseClient
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (dailyUsageError && dailyUsageError.code !== 'PGRST116') {
      throw dailyUsageError;
    }

    // Initialize or get daily usage
    let currentDailyUsage = dailyUsage || {
      user_id: user.id,
      date: today,
      responses_count: 0,
      output_tokens_used: 0,
      input_tokens_used: 0,
    };

    // Calculate max tokens based on plan and response type
    let maxOutputTokens = 400;
    if (activePlan) {
      // If paid plan, use remaining tokens
      maxOutputTokens = activePlan.remaining_output_tokens;
    } else if (requiresDetailedResponse) {
      // If free plan and detailed response requested, allow up to 800 tokens
      maxOutputTokens = 800;
    }

    // Check free plan limits
    if (!activePlan) {
      if (currentDailyUsage.responses_count >= 7) {
        return new Response(
          JSON.stringify({
            error: 'Daily response limit exceeded. Please upgrade or wait until tomorrow.',
            limitExceeded: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Call GPT-4 API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxOutputTokens,
      }),
    });

    const gptResponse = await response.json();
    const outputTokens = gptResponse.usage.completion_tokens;
    const inputTokens = gptResponse.usage.prompt_tokens;

    // Update usage based on plan type
    if (activePlan) {
      // Update paid plan usage
      await supabaseClient
        .from('user_plans')
        .update({
          remaining_output_tokens: activePlan.remaining_output_tokens - outputTokens,
          remaining_input_tokens: activePlan.remaining_input_tokens - inputTokens,
          status: activePlan.remaining_output_tokens - outputTokens <= 0 ? 'expired' : 'active'
        })
        .eq('id', activePlan.id);
    } else {
      // Update free plan usage
      await supabaseClient
        .from('user_daily_usage')
        .upsert({
          ...currentDailyUsage,
          responses_count: (currentDailyUsage.responses_count || 0) + 1,
          output_tokens_used: (currentDailyUsage.output_tokens_used || 0) + outputTokens,
          input_tokens_used: (currentDailyUsage.input_tokens_used || 0) + inputTokens,
          last_usage_time: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify({
        message: gptResponse.choices[0].message.content,
        usage: {
          output_tokens: outputTokens,
          input_tokens: inputTokens
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
