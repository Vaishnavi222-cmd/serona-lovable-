
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting payment verification...');
    const { orderId, paymentId, signature, planType } = await req.json();

    // Validate input
    if (!orderId || !paymentId || !signature || !planType) {
      console.error('Missing required fields:', { orderId, paymentId, signature, planType });
      throw new Error('Missing required payment verification fields');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Server configuration error');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Unauthorized');
    }

    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Unauthorized');
    }

    // Verify signature
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!secret) {
      console.error('Missing Razorpay secret key');
      throw new Error('Server configuration error');
    }

    const payload = orderId + '|' + paymentId;
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const message = encoder.encode(payload);
    
    const hmac = createHmac("sha256", key);
    hmac.update(message);
    const generatedSignature = hmac.toString();

    console.log('Signature verification:', {
      provided: signature,
      generated: generatedSignature,
      match: signature === generatedSignature
    });

    if (generatedSignature !== signature) {
      console.error('Signature verification failed');
      throw new Error('Invalid payment signature');
    }

    // Get current time for plan start
    const now = new Date();
    
    // Insert the plan
    const { data: planData, error: planError } = await client
      .from('user_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId,
        status: 'active',
        start_time: now.toISOString(),
      })
      .select()
      .single();

    if (planError) {
      console.error('Error inserting plan:', planError);
      throw planError;
    }

    console.log('Plan created successfully:', planData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified and plan activated successfully',
        plan: planData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'If payment was deducted, it will be automatically refunded'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
