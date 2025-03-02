
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from 'npm:razorpay@2.9.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ebookId } = await req.json()
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Missing Razorpay credentials')
    }

    // Initialize Razorpay immediately
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    // Create Razorpay order immediately with fixed price (₹100)
    // This is faster than fetching from DB first
    const order = await razorpay.orders.create({
      amount: 100 * 100, // ₹100 in paise
      currency: 'INR',
    })

    console.log('Created Razorpay order:', order.id)

    // Start async background task to record the order
    const recordOrder = async () => {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase credentials')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Record the order in the background
        const { error: purchaseError } = await supabase
          .from('ebook_purchases')
          .insert([{
            ebook_id: ebookId,
            order_id: order.id,
            amount_paid: 100, // ₹100
            purchase_status: 'pending'
          }])

        if (purchaseError) {
          console.error('Error recording purchase:', purchaseError)
        }
      } catch (error) {
        console.error('Background task error:', error)
      }
    }

    // Execute background task without waiting
    EdgeRuntime.waitUntil(recordOrder())

    // Return order details immediately
    return new Response(
      JSON.stringify({
        orderId: order.id,
        keyId: razorpayKeyId,
        amount: 100 * 100, // ₹100 in paise
        currency: 'INR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
