
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Creating order for plan:', planType);

    // Validate Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Missing Razorpay credentials');
      throw new Error('Payment service configuration error');
    }

    // Set amount based on plan type
    let amount = 0;
    switch (planType) {
      case 'hourly':
        amount = 2500; // ₹25
        break;
      case 'daily':
        amount = 15000; // ₹150
        break;
      case 'monthly':
        amount = 299900; // ₹2,999
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // Generate a shorter receipt ID (max 40 chars)
    const timestamp = Date.now().toString().slice(-8);
    const receiptId = `rcpt_${planType}_${timestamp}`;
    
    console.log(`Creating Razorpay order with receipt: ${receiptId}`);

    // Create Razorpay order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          plan_type: planType,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Razorpay API error:', errorData);
      throw new Error('Failed to create payment order');
    }

    const order = await response.json();
    console.log('Razorpay order created successfully:', order.id);

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
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
