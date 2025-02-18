
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

    // Check active plan
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

    // If no active plan, check free tier limits
    if (!activePlan) {
      const { data: dailyUsage, error: usageError } = await client
        .from('user_daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }

      // Free tier limits
      const maxResponses = 7;
      const maxOutputTokens = 800;

      if (dailyUsage) {
        if (dailyUsage.responses_count >= maxResponses) {
          throw new Error('Daily response limit exceeded for free plan');
        }
        if (dailyUsage.output_tokens_used + output_tokens > maxOutputTokens) {
          throw new Error('Output token limit exceeded for free plan');
        }
      }

      return new Response(
        JSON.stringify({ allowed: true, remaining_responses: maxResponses - (dailyUsage?.responses_count || 0) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check paid plan limits
    if (new Date(activePlan.end_time) < new Date()) {
      // Update plan status to expired
      await client
        .from('user_plans')
        .update({ status: 'expired' })
        .eq('id', activePlan.id);
      
      throw new Error('Plan has expired');
    }

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
  } catch (error) {
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
