import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from "https://esm.sh/razorpay@2.9.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://serona.ai',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { planType } = await req.json()

    console.log("plantype", planType)

    if (!planType) {
      throw new Error('Missing plan type')
    }

    const price = planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900

    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    });

    const order = await razorpay.orders.create({
      amount: price,
      currency: 'INR',
      receipt: `receipt_${Math.random().toString(36).substring(2, 15)}`,
    });

    const response = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: Deno.env.get('RAZORPAY_KEY_ID')
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
  } catch (error) {
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
