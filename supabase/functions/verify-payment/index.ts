
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, paymentId, signature, planType } = await req.json();
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify signature
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
    const hmac = createHmac('sha256', secret);
    const data = orderId + '|' + paymentId;
    const generated_signature = hmac.update(data).digest('hex');

    if (generated_signature !== signature) {
      throw new Error('Invalid payment signature');
    }

    // Add user plan to database
    const { error: planError } = await client
      .from('user_plans')
      .insert({
        user_id: user.id,
        plan_type: planType,
        payment_id: paymentId,
        order_id: orderId,
        status: 'active',
        start_time: new Date().toISOString(),
      });

    if (planError) {
      throw planError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
