
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
    console.log('Received request for plan type:', planType);

    // Get credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    console.log('Checking Razorpay credentials...');
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    console.log('Razorpay credentials found');

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
        throw new Error('Invalid plan type');
    }

    console.log('Creating Razorpay order with amount:', amount);

    // Create Razorpay order using fetch
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      }),
    });

    console.log('Razorpay API response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('Razorpay API error response:', errorData);
      throw new Error(`Razorpay API error: ${errorData}`);
    }

    const order = await razorpayResponse.json();
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
        details: typeof error === 'object' ? JSON.stringify(error) : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
