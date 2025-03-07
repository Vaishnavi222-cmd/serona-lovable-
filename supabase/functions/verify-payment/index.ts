
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to verify Razorpay signature
async function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = `${orderId}|${paymentId}`;
    const key = encoder.encode(secret);
    const data = encoder.encode(message);
    
    const hashBuffer = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      hashBuffer,
      data
    );
    
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Helper function to verify payment with Razorpay API
async function verifyRazorpayPayment(orderId: string, keyId: string, keySecret: string): Promise<boolean> {
  try {
    const auth = btoa(`${keyId}:${keySecret}`);
    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order from Razorpay');
    }

    const order = await response.json();
    console.log('Razorpay order details:', order);
    
    return order.status === 'paid';
  } catch (error) {
    console.error('Razorpay API verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !supabaseServiceKey || !razorpayKeyId || !razorpaySecret) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Log incoming request data
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    console.log('Received payment verification request:', { 
      orderId, 
      paymentId, 
      signature: signature?.substring(0, 10) + '...', 
      planType, 
      userId 
    });

    // Enhanced validation
    if (!orderId || !paymentId || !signature || !planType || !userId) {
      console.error('Missing payment information:', { orderId, paymentId, planType, userId });
      throw new Error('Missing required payment information');
    }

    // Step 1: Verify payment signature with retries
    let isSignatureValid = false;
    for (let i = 0; i < 3; i++) {
      isSignatureValid = await verifyRazorpaySignature(orderId, paymentId, signature, razorpaySecret);
      if (isSignatureValid) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Signature verification result:', isSignatureValid);
    if (!isSignatureValid) {
      throw new Error('Invalid payment signature');
    }

    // Step 2: Double-check with Razorpay API with retries
    let isPaymentVerified = false;
    for (let i = 0; i < 3; i++) {
      isPaymentVerified = await verifyRazorpayPayment(orderId, razorpayKeyId, razorpaySecret);
      if (isPaymentVerified) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Razorpay API verification result:', isPaymentVerified);
    if (!isPaymentVerified) {
      throw new Error('Payment verification failed with Razorpay API');
    }

    // Step 3: Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid user');
    }

    // Step 4: Mark existing active plans as expired with retry
    let updateError = null;
    for (let i = 0; i < 3; i++) {
      const { error } = await supabase
        .from('user_plans')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!error) {
        updateError = null;
        break;
      }
      updateError = error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (updateError) {
      console.error('Error updating existing plans:', updateError);
      throw updateError;
    }

    // Step 5: Create new plan with enhanced retry mechanism
    let planData = null;
    let insertError = null;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error } = await supabase
          .from('user_plans')
          .insert([{
            user_id: userId,
            plan_type: planType,
            status: 'active',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + (planType === 'hourly' ? 3600000 : planType === 'daily' ? 43200000 : 2592000000)).toISOString(),
            remaining_output_tokens: planType === 'hourly' ? 9000 : planType === 'daily' ? 108000 : 3240000,
            remaining_input_tokens: planType === 'hourly' ? 5000 : planType === 'daily' ? 60000 : 1800000,
            amount_paid: planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900,
            order_id: orderId,
            payment_id: paymentId
          }])
          .select();

        if (error) throw error;
        planData = data;
        console.log('Plan created successfully:', planData);
        break;
      } catch (error) {
        console.error(`Insert attempt ${i + 1} failed:`, error);
        insertError = error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!planData || planData.length === 0) {
      console.error('Failed to create plan after retries:', insertError);
      throw new Error('Failed to create plan after multiple attempts');
    }

    return new Response(
      JSON.stringify({ success: true, data: planData[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment verification failed:', error);
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
