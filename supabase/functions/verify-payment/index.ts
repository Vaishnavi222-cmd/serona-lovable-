
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment verification process...');
    const { orderId, paymentId, signature, planType } = await req.json();
    
    // Log the received data
    console.log('Received payment data:', { orderId, paymentId, planType });

    if (!orderId || !paymentId || !signature || !planType) {
      throw new Error('Missing required payment verification fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !supabaseKey || !razorpaySecret) {
      throw new Error('Missing required configuration');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header found');
    }

    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('User verification failed');
    }

    // Generate HMAC signature for verification
    const payload = `${orderId}|${paymentId}`;
    const key = new TextEncoder().encode(razorpaySecret);
    const message = new TextEncoder().encode(payload);
    
    const hmacBuffer = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      hmacBuffer,
      message
    );
    
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Signature check:', {
      provided: signature,
      generated: generatedSignature,
      match: signature === generatedSignature
    });

    if (signature !== generatedSignature) {
      throw new Error('Invalid payment signature');
    }

    // Set plan limits based on plan type
    let outputTokens, inputTokens;
    switch (planType) {
      case 'hourly':
        outputTokens = 9000;
        inputTokens = 5000;
        break;
      case 'daily':
        outputTokens = 108000;
        inputTokens = 60000;
        break;
      case 'monthly':
        outputTokens = 3240000;
        inputTokens = 1800000;
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // Deactivate any existing active plans
    const { error: deactivateError } = await client
      .from('user_plans')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (deactivateError) {
      console.error('Error deactivating existing plans:', deactivateError);
      throw deactivateError;
    }

    // Insert new plan
    const { data: planData, error: planError } = await client
      .from('user_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId,
        status: 'active',
        remaining_output_tokens: outputTokens,
        remaining_input_tokens: inputTokens,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating plan:', planError);
      throw planError;
    }

    console.log('Plan created successfully:', planData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and plan activated',
        plan: planData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Payment verification failed. Our team will verify and activate your plan manually.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
