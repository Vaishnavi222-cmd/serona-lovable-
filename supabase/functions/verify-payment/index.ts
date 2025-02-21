
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderId, paymentId, planType } = await req.json()
    
    if (!orderId || !paymentId || !planType) {
      throw new Error('Missing required parameters')
    }

    console.log('Starting payment verification:', { orderId, paymentId, planType })

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpayKey = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl || !supabaseServiceKey || !razorpayKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      throw new Error('Authentication failed')
    }

    console.log('Authenticated user:', user.id)

    // Verify payment with Razorpay
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${btoa(razorpayKey + ':')}`
      }
    })

    const paymentData = await response.json()
    console.log('Razorpay payment data:', paymentData)

    if (paymentData.error) {
      throw new Error(`Payment verification failed: ${paymentData.error.description}`)
    }

    if (paymentData.status !== 'captured') {
      throw new Error(`Payment not captured. Status: ${paymentData.status}`)
    }

    // Get plan details
    const planAmounts = {
      hourly: 2500,
      daily: 15000,
      monthly: 299900
    }

    // Insert plan using the set_plan_limits trigger
    const { data: planData, error: insertError } = await supabase
      .from('user_plans')
      .insert([
        {
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          amount_paid: planAmounts[planType],
          start_time: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Plan insertion error:', insertError)
      throw new Error('Failed to create plan')
    }

    console.log('Plan created successfully:', planData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and plan activated',
        plan: planData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
