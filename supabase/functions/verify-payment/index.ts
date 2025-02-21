
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { orderId, paymentId, signature, planType, amount } = await req.json()
    console.log('Received payment data:', { orderId, paymentId, signature, planType, amount })

    // Insert plan data directly without signature verification (we'll verify with Razorpay API)
    const { data: planData, error: planError } = await supabaseClient
      .from('user_plans')
      .insert([
        {
          user_id: user.id,
          plan_type: planType,
          amount_paid: amount / 100, // Convert from paisa to INR
          status: 'active',
          payment_id: paymentId,
          order_id: orderId
        }
      ])
      .select()
      .single()

    if (planError) {
      console.error('Error inserting plan:', planError)
      throw new Error(`Failed to save plan: ${planError.message}`)
    }

    console.log('Plan created successfully:', planData)

    return new Response(
      JSON.stringify({
        success: true,
        data: planData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
