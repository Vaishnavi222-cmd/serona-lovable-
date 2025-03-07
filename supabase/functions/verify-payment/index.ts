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

// Enhanced retry mechanism for plan updates
async function updatePlanWithRetry(supabase: any, userId: string, planType: string, orderId: string, paymentId: string, amount: number, maxRetries = 5): Promise<boolean> {
  console.log('Starting plan update with retries:', { userId, planType, orderId, maxRetries });
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First verify if the plan is already updated to avoid duplicates
      const { data: existingPlan } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('order_id', orderId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingPlan) {
        console.log('Plan already updated:', existingPlan);
        return true;
      }

      // Expire any existing active plans
      const { error: updateError } = await supabase
        .from('user_plans')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        console.error(`Attempt ${attempt + 1}: Error updating existing plans:`, updateError);
        continue;
      }

      // Insert new plan
      const { data: newPlan, error: insertError } = await supabase
        .from('user_plans')
        .insert([{
          user_id: userId,
          plan_type: planType,
          status: 'active',
          start_time: new Date().toISOString(),
          order_id: orderId,
          payment_id: paymentId,
          amount_paid: amount
        }])
        .select()
        .single();

      if (insertError) {
        console.error(`Attempt ${attempt + 1}: Error creating new plan:`, insertError);
        continue;
      }

      console.log('Plan created successfully:', newPlan);
      return true;

    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Unexpected error:`, error);
      if (attempt === maxRetries - 1) throw error;
    }

    // Exponential backoff between retries
    const delay = Math.min(200 * Math.pow(2, attempt), 2000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

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

    // Parse request body and check for mobile flag
    const { orderId, paymentId, signature, planType, userId, isMobile } = await req.json();
    console.log('Starting payment verification for:', { orderId, paymentId, planType, userId, isMobile });

    // Initialize Supabase client with explicit headers for mobile
    const supabaseConfig = {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    };

    if (isMobile) {
      Object.assign(supabaseConfig, {
        global: {
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`
          }
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, supabaseConfig);

    // Verify all required parameters
    if (!orderId || !paymentId || !signature || !planType || !userId) {
      console.error('Missing required payment information');
      throw new Error('Missing required payment information');
    }

    // Verify signature with retries
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

    // Verify payment with Razorpay API with retries
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

    // Try to update plan with retries
    const planUpdated = await updatePlanWithRetry(supabase, userId, planType, orderId, paymentId, planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900);
    
    if (!planUpdated) {
      throw new Error('Failed to update plan after multiple attempts');
    }

    // Final verification of plan update
    const { data: finalVerification, error: verificationError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .eq('status', 'active')
      .maybeSingle();

    if (verificationError || !finalVerification) {
      console.error('Final verification failed:', verificationError);
      throw new Error('Plan update could not be verified');
    }

    return new Response(
      JSON.stringify({ success: true, data: finalVerification }),
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
