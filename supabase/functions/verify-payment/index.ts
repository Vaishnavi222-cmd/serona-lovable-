
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
    console.log('------- PAYMENT VERIFICATION START -------');
    const requestBody = await req.json();
    console.log('1. Full request body:', requestBody);
    
    const { orderId, paymentId, signature, planType } = requestBody;
    console.log('2. Extracted values:', { orderId, paymentId, signature, planType });

    if (!orderId || !paymentId || !signature || !planType) {
      console.error('3. Missing fields in request');
      throw new Error('Missing required payment verification fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log('4. Environment variables check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasRazorpaySecret: !!razorpaySecret
    });

    if (!supabaseUrl || !supabaseKey || !razorpaySecret) {
      console.error('5. Missing environment variables');
      throw new Error('Missing required configuration');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    console.log('6. Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('7. No authorization header found');
      throw new Error('No authorization header found');
    }

    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    console.log('8. User verification:', { 
      success: !!user, 
      error: userError ? userError.message : null,
      userId: user?.id 
    });

    if (userError || !user) {
      console.error('9. User verification failed:', userError);
      throw new Error('User verification failed');
    }

    // Generate verification signature
    const payload = `${orderId}|${paymentId}`;
    console.log('10. Generated payload:', payload);

    // Convert secret to bytes
    const key = new TextEncoder().encode(razorpaySecret);
    const message = new TextEncoder().encode(payload);
    
    console.log('11. Starting HMAC generation');
    
    // Create HMAC
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

    console.log('12. Signature comparison:', {
      receivedSignature: signature,
      generatedSignature: generatedSignature,
      match: signature === generatedSignature,
      receivedLength: signature?.length,
      generatedLength: generatedSignature.length
    });

    if (signature !== generatedSignature) {
      console.error('13. Signature verification failed');
      throw new Error('Invalid payment signature');
    }

    console.log('14. Starting plan creation');

    // First deactivate any existing active plans for this user
    const { error: deactivateError } = await client
      .from('user_plans')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('15. Deactivation result:', { error: deactivateError });

    if (deactivateError) {
      console.error('16. Error deactivating plans:', deactivateError);
      throw deactivateError;
    }

    // Calculate plan limits
    const planLimits = {
      hourly: { output: 9000, input: 5000 },
      daily: { output: 108000, input: 60000 },
      monthly: { output: 3240000, input: 1800000 }
    }[planType];

    if (!planLimits) {
      console.error('17. Invalid plan type:', planType);
      throw new Error('Invalid plan type');
    }

    console.log('18. Creating new plan with limits:', planLimits);

    // Insert new plan
    const { data: planData, error: planError } = await client
      .from('user_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId,
        status: 'active',
        remaining_output_tokens: planLimits.output,
        remaining_input_tokens: planLimits.input,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    console.log('19. Plan creation result:', {
      success: !!planData,
      error: planError ? planError.message : null,
      planData
    });

    if (planError) {
      console.error('20. Error creating plan:', planError);
      throw planError;
    }

    console.log('------- PAYMENT VERIFICATION SUCCESS -------');

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
    console.error('------- PAYMENT VERIFICATION FAILED -------');
    console.error('Final error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Payment verification failed. Please contact support with your payment ID and we will activate your plan.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
