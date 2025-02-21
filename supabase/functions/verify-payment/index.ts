
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get request body
    const { orderId, paymentId, signature, planType } = await req.json()

    // Basic validation
    if (!orderId || !paymentId || !signature || !planType) {
      throw new Error('Missing required payment information')
    }

    console.log('Verifying payment:', { orderId, paymentId, signature, planType })

    // Verify the payment signature
    const body = orderId + "|" + paymentId
    const crypto = await import('https://deno.land/std@0.177.0/node/crypto.ts')
    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    console.log('Signature comparison:', {
      received: signature,
      expected: expectedSignature,
    })

    if (signature !== expectedSignature) {
      throw new Error('Invalid payment signature')
    }

    // Verify payment with Razorpay API
    const paymentVerifyUrl = `https://api.razorpay.com/v1/payments/${paymentId}`
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

    const response = await fetch(paymentVerifyUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    const paymentData = await response.json()
    console.log('Razorpay payment data:', paymentData)

    if (!response.ok || paymentData.error) {
      throw new Error('Payment verification failed with Razorpay')
    }

    // Start a transaction to update the database
    const { data, error: insertError } = await supabaseClient.rpc('create_user_plan', {
      p_user_id: user.id,
      p_plan_type: planType,
      p_amount_paid: paymentData.amount / 100, // Convert from paisa to INR
      p_payment_id: paymentId,
      p_order_id: orderId
    })

    if (insertError) {
      console.error('Database error:', insertError)
      throw new Error('Failed to save plan data')
    }

    console.log('Plan created successfully:', data)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and plan activated',
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in verify-payment:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
