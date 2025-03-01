
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateRazorpaySignature(orderId: string, paymentId: string, secret: string) {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.toString("hex");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!supabaseUrl || !supabaseServiceKey || !razorpayKeySecret) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { orderId, paymentId, signature, planType, userId } = await req.json();
    
    console.log('Payment verification request:', {
      orderId,
      paymentId, 
      planType, 
      userId,
      signature: signature?.substring(0, 10) + '...'
    });

    if (!orderId || !paymentId || !signature || !planType || !userId) {
      throw new Error('Missing required payment information');
    }

    // Step 1: Verify Razorpay signature
    const expectedSignature = generateRazorpaySignature(
      orderId,
      paymentId,
      razorpayKeySecret
    );

    console.log('Signature verification:', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: signature.substring(0, 10) + '...',
      match: expectedSignature === signature
    });

    if (expectedSignature !== signature) {
      throw new Error('Payment verification failed with Razorpay API');
    }

    // Convert plan type amount to paise (Indian currency)
    const planAmounts = {
      'hourly': 2500,   // Rs. 25 in paise
      'daily': 15000,   // Rs. 150 in paise
      'monthly': 299900 // Rs. 2,999 in paise
    };

    // Call our new database function to handle the plan update
    const { data, error: transactionError } = await supabase.rpc('handle_plan_update', {
      p_user_id: userId,
      p_plan_type: planType,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount: planAmounts[planType]
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
    console.error('Payment verification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
