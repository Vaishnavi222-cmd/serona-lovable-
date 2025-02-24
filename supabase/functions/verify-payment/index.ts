
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Log request data
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    console.log('Processing payment:', { orderId, paymentId, planType, userId });

    // Enhanced validation
    if (!orderId || !paymentId || !signature || !planType || !userId) {
      throw new Error('Missing required payment information');
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid user');
    }

    // Calculate durations and tokens based on plan type
    let duration, outputTokens, inputTokens, amount;
    switch (planType) {
      case 'hourly':
        duration = '1 hour';
        outputTokens = 9000;
        inputTokens = 5000;
        amount = 2500;
        break;
      case 'daily':
        duration = '12 hours';
        outputTokens = 108000;
        inputTokens = 60000;
        amount = 15000;
        break;
      case 'monthly':
        duration = '30 days';
        outputTokens = 3240000;
        inputTokens = 1800000;
        amount = 299900;
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // First, mark any existing active plans as expired
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (updateError) {
      console.error('Error updating existing plans:', updateError);
      throw updateError;
    }

    console.log('Creating new plan for user:', userId);

    // Insert new plan with all required fields
    const { data: planData, error: insertError } = await supabase
      .from('user_plans')
      .insert([{
        user_id: userId,
        plan_type: planType,
        status: 'active',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (planType === 'hourly' ? 3600000 : planType === 'daily' ? 43200000 : 2592000000)).toISOString(),
        remaining_output_tokens: outputTokens,
        remaining_input_tokens: inputTokens,
        amount_paid: amount
      }])
      .select();

    if (insertError) {
      console.error('Database error:', insertError);
      throw insertError;
    }

    if (!planData || planData.length === 0) {
      throw new Error('Failed to create plan');
    }

    console.log('Plan created successfully:', planData[0]);

    return new Response(
      JSON.stringify({ success: true, data: planData[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
