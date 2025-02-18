
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Razorpay from "npm:razorpay@2.9.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { planType } = await req.json();
    
    // Log request details
    console.log('Received request for plan type:', planType);

    // Verify Razorpay credentials exist
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      throw new Error('Razorpay credentials not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Supabase credentials not configured');
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      console.error('No authorization header found');
      throw new Error('Authorization required');
    }

    const { data: { user }, error: userError } = await client.auth.getUser(authHeader);
    
    if (userError) {
      console.error('User authentication error:', userError);
      throw userError;
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error('User not found');
    }

    console.log('User authenticated:', user.id);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Set amount based on plan type
    let amount = 0;
    switch (planType) {
      case 'hourly':
        amount = 2500; // ₹25.00
        break;
      case 'daily':
        amount = 15000; // ₹150.00
        break;
      case 'monthly':
        amount = 299900; // ₹2,999.00
        break;
      default:
        console.error('Invalid plan type:', planType);
        throw new Error('Invalid plan type');
    }

    console.log('Creating order for plan:', planType, 'amount:', amount);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `plan_${planType}_${user.id}_${Date.now()}`,
    });

    console.log('Order created successfully:', order.id);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-payment function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
