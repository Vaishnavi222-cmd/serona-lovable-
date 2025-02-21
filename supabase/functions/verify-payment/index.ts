
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No auth token provided')
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get payment details from request
    const { orderId, paymentId, planType, amount } = await req.json()
    
    console.log('Processing payment verification:', {
      userId: user.id,
      orderId,
      paymentId,
      planType,
      amount
    })

    // Deactivate any existing active plans
    const { error: deactivateError } = await supabaseAdmin
      .from('user_plans')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (deactivateError) {
      console.error('Error deactivating old plans:', deactivateError)
      throw new Error('Failed to deactivate old plans')
    }

    // Create new plan
    const { data: planData, error: planError } = await supabaseAdmin
      .rpc('create_user_plan', {
        p_user_id: user.id,
        p_plan_type: planType,
        p_amount_paid: amount / 100,
        p_payment_id: paymentId,
        p_order_id: orderId
      })

    if (planError) {
      console.error('Error creating plan:', planError)
      throw new Error('Failed to create plan')
    }

    console.log('Plan created successfully:', planData)

    return new Response(
      JSON.stringify({
        success: true,
        data: planData
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
