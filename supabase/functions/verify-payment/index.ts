
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

// Helper function to verify plan update with retries
async function verifyPlanUpdate(supabase: any, userId: string, orderId: string, maxRetries = 5): Promise<boolean> {
  console.log('Starting plan update verification with retries:', { userId, orderId, maxRetries });
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: plan, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('order_id', orderId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error(`Attempt ${attempt + 1}: Error checking plan:`, error);
        continue;
      }

      if (plan) {
        console.log('Plan update verified successfully:', plan);
        return true;
      }

      console.log(`Attempt ${attempt + 1}: Plan not found, waiting before retry...`);
      const delay = Math.min(200 * Math.pow(2, attempt), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Unexpected error:`, error);
    }
  }

  console.error('Plan verification failed after all retries');
  return false;
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

    // Initialize Supabase client with service role key and explicit headers
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          apikey: supabaseServiceKey
        }
      }
    });
    
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    console.log('Received payment verification request:', { 
      orderId, 
      paymentId, 
      signature: signature?.substring(0, 10) + '...', 
      planType, 
      userId 
    });

    if (!orderId || !paymentId || !signature || !planType || !userId) {
      console.error('Missing payment information:', { orderId, paymentId, planType, userId });
      throw new Error('Missing required payment information');
    }

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

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid user');
    }

    // Mark existing active plans as expired with explicit error handling
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
      console.error(`Update attempt ${i + 1} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (updateError) {
      console.error('Error updating existing plans:', updateError);
      throw updateError;
    }

    let planData = null;
    let insertError = null;
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Use explicit await and error handling for plan creation
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

        if (error) {
          console.error(`Insert error on attempt ${i + 1}:`, error);
          throw error;
        }

        planData = data;
        
        // Verify the plan was actually created
        const isPlanVerified = await verifyPlanUpdate(supabase, userId, orderId);
        if (!isPlanVerified) {
          throw new Error('Plan creation could not be verified');
        }
        
        console.log('Plan created and verified successfully:', planData);
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
