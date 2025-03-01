
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from "https://esm.sh/razorpay@2.9.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Create payment function started')
    
    const key_id = Deno.env.get('RAZORPAY_KEY_ID')
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!key_id || !key_secret) {
      throw new Error('Missing Razorpay credentials')
    }

    console.log('Razorpay credentials found')
    
    const { planType } = await req.json()
    console.log('Creating order for plan type:', planType)

    if (!planType) {
      throw new Error('Missing plan type')
    }

    // Calculate price based on plan type (in paise)
    const price = planType === 'hourly' ? 2500 : planType === 'daily' ? 15000 : 299900

    try {
      const razorpay = new Razorpay({
        key_id: key_id,
        key_secret: key_secret
      })

      console.log('Creating Razorpay order with config:', {
        amount: price,
        currency: 'INR'
      })

      const order = await razorpay.orders.create({
        amount: price,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      })

      console.log('Razorpay order created successfully:', order.id)

      return new Response(
        JSON.stringify({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: key_id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } catch (error) {
      console.error('Razorpay API Error:', error)
      throw new Error(`Razorpay order creation failed: ${error.message}`)
    }
  } catch (error) {
    console.error('Payment creation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
