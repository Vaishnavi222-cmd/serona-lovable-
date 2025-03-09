
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input_tokens, output_tokens } = await req.json();
    
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check active plan with expiry check
    const { data: activePlan, error: planError } = await client
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (planError && planError.code !== 'PGRST116') {
      throw planError;
    }

    // Add strict plan expiry check for paid users
    if (activePlan) {
      if (new Date(activePlan.end_time) < new Date()) {
        // Update plan status to expired
        await client
          .from('user_plans')
          .update({ status: 'expired' })
          .eq('id', activePlan.id);
        
        return new Response(
          JSON.stringify({
            allowed: false,
            error: 'Your plan has expired. Please upgrade to continue using Serona AI.',
            planExpired: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Continue with existing paid plan logic
      if (activePlan.remaining_input_tokens < input_tokens) {
        throw new Error('Input token limit exceeded');
      }
  
      if (activePlan.remaining_output_tokens < output_tokens) {
        throw new Error('Output token limit exceeded');
      }
  
      // Update remaining tokens
      const { error: updateError } = await client
        .from('user_plans')
        .update({
          remaining_input_tokens: activePlan.remaining_input_tokens - input_tokens,
          remaining_output_tokens: activePlan.remaining_output_tokens - output_tokens,
        })
        .eq('id', activePlan.id);
  
      if (updateError) {
        throw updateError;
      }
  
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining_input_tokens: activePlan.remaining_input_tokens - input_tokens,
          remaining_output_tokens: activePlan.remaining_output_tokens - output_tokens,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Continue with existing free plan logic
    const currentDate = new Date().toISOString().split('T')[0];
    const { data: dailyUsage, error: usageError } = await client
      .from('user_daily_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', currentDate)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }

    // Free tier limits
    const maxResponses = 7;
    const baseMaxOutputTokens = 400;
    const absoluteMaxOutputTokens = 800;

    if (dailyUsage) {
      // Check response count
      if (dailyUsage.responses_count >= maxResponses) {
        // Calculate time until reset
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilReset = tomorrow.getTime() - now.getTime();
        const minutesUntilReset = Math.ceil(msUntilReset / (1000 * 60));

        return new Response(
          JSON.stringify({
            allowed: false,
            error: `Daily response limit exceeded. Plan resets in ${minutesUntilReset} minutes`,
            usageStats: {
              responsesUsed: dailyUsage.responses_count,
              responsesLimit: maxResponses,
              tokensUsed: dailyUsage.output_tokens_used,
              baseTokenLimit: baseMaxOutputTokens,
              extendedTokenLimit: absoluteMaxOutputTokens,
              minutesUntilReset
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Check if requested output tokens exceed the absolute maximum
      if (output_tokens > absoluteMaxOutputTokens) {
        return new Response(
          JSON.stringify({
            allowed: false,
            error: `Requested output exceeds maximum allowed tokens (${absoluteMaxOutputTokens})`,
            usageStats: {
              responsesUsed: dailyUsage.responses_count,
              responsesLimit: maxResponses,
              tokensUsed: dailyUsage.output_tokens_used,
              baseTokenLimit: baseMaxOutputTokens,
              extendedTokenLimit: absoluteMaxOutputTokens
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Check if total output tokens would exceed the limit
      if (dailyUsage.output_tokens_used + output_tokens > absoluteMaxOutputTokens) {
        return new Response(
          JSON.stringify({
            allowed: false,
            error: `Output token limit exceeded for free plan`,
            usageStats: {
              responsesUsed: dailyUsage.responses_count,
              responsesLimit: maxResponses,
              tokensUsed: dailyUsage.output_tokens_used,
              baseTokenLimit: baseMaxOutputTokens,
              extendedTokenLimit: absoluteMaxOutputTokens
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Warn if exceeding base limit but still under absolute limit
      const warning = output_tokens > baseMaxOutputTokens ? 
        "Warning: Response exceeds standard token limit but falls within extended limit" : null;

      return new Response(
        JSON.stringify({ 
          allowed: true, 
          remaining_responses: maxResponses - dailyUsage.responses_count,
          warning,
          usageStats: {
            responsesUsed: dailyUsage.responses_count,
            responsesLimit: maxResponses,
            tokensUsed: dailyUsage.output_tokens_used,
            baseTokenLimit: baseMaxOutputTokens,
            extendedTokenLimit: absoluteMaxOutputTokens
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining_responses: maxResponses,
        usageStats: {
          responsesUsed: 0,
          responsesLimit: maxResponses,
          tokensUsed: 0,
          baseTokenLimit: baseMaxOutputTokens,
          extendedTokenLimit: absoluteMaxOutputTokens
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-plan-limits:', error);
    return new Response(
      JSON.stringify({
        allowed: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
