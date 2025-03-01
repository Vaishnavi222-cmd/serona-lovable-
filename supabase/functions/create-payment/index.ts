
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from "https://esm.sh/razorpay@2.9.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Create payment function started');
    
    // Get the API keys from environment variables
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!key_id || !key_secret) {
      console.error('Missing Razorpay credentials');
      throw new Error('Payment system configuration error');
    }

    console.log('Razorpay credentials found');
    
    // Parse request body
    const { planType } = await req.json()

    if (!planType) {
      throw new Error('Missing plan type')
    }

    console.log('Creating order for plan type:', planType);

    // Calculate price based on plan type (in paise)
    const price = planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900

    try {
      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: key_id,
        key_secret: key_secret
      });

      console.log('Creating Razorpay order...');

      // Create order
      const order = await razorpay.orders.create({
        amount: price,
        currency: 'INR',
        receipt: `receipt_${Math.random().toString(36).substring(2, 15)}`,
        payment_capture: 1,
      });

      console.log('Razorpay order created successfully:', order.id);

      const response = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: key_id
      }

      return new Response(
        JSON.stringify(response),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200 
        }
      )
    } catch (razorpayError) {
      console.error('Razorpay API Error:', razorpayError);
      throw new Error(`Failed to create payment order: ${razorpayError.message}`);
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400 
      }
    )
  }
})
