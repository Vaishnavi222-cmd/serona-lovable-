
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
    
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    console.log('Received payment verification request:', { 
      orderId, 
      paymentId, 
      planType, 
      userId,
      signature: signature?.substring(0, 10) + '...'
    });

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

    // Step 3: Begin database transaction
    const { data, error: transactionError } = await supabase.rpc('handle_plan_update', {
      p_user_id: userId,
      p_plan_type: planType,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount: planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900
    });

    if (transactionError) {
      console.error('Database transaction error:', transactionError);
      throw new Error('Failed to update plan in database');
    }

    console.log('Plan created successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
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
