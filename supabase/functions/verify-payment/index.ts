
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  // Handle CORS
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

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    console.log('Received payment verification request:', { 
      orderId, 
      paymentId, 
      planType, 
      userId,
      signature: signature?.substring(0, 10) + '...' // Log partial signature for security
    });

    // Enhanced validation
    if (!orderId || !paymentId || !signature || !planType || !userId) {
      throw new Error('Missing required payment information');
    }

    // Step 1: Verify signature
    const isSignatureValid = await verifyRazorpaySignature(orderId, paymentId, signature, razorpaySecret);
    console.log('Signature verification result:', isSignatureValid);
    
    if (!isSignatureValid) {
      throw new Error('Invalid payment signature');
    }

    // Step 2: Double-check with Razorpay API
    const isPaymentVerified = await verifyRazorpayPayment(orderId, razorpayKeyId, razorpaySecret);
    console.log('Razorpay API verification result:', isPaymentVerified);
    
    if (!isPaymentVerified) {
      throw new Error('Payment verification failed with Razorpay API');
    }

    // Step 3: Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid user');
    }

    // Step 4: Mark existing active plans as expired
    const { error: updateError } = await supabase
      .from('user_plans')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (updateError) {
      console.error('Error updating existing plans:', updateError);
      throw updateError;
    }

    // Step 5: Create new plan
    const { data: planData, error: insertError } = await supabase
      .from('user_plans')
      .insert([{
        user_id: userId,
        plan_type: planType,
        status: 'active',
        start_time: new Date().toISOString(),
        order_id: orderId,
        payment_id: paymentId,
        amount_paid: planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900
      }])
      .select()
      .single();

    if (insertError || !planData) {
      console.error('Error creating new plan:', insertError);
      throw insertError;
    }

    console.log('Plan created successfully:', planData);

    return new Response(
      JSON.stringify({ success: true, data: planData }),
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

