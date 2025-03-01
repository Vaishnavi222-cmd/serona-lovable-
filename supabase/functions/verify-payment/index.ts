import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import crypto from 'https://deno.land/std@0.177.0/node/crypto.ts'

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
    const { orderId, paymentId, signature, planType, userId } = await req.json()

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY!)
      .update(orderId + "|" + paymentId)
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new Error('Invalid signature. Payment verification failed.')
    }

    const supabaseClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

    const { data: existingPlan } = await supabaseClient
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingPlan) {
      await supabaseClient
        .from('user_plans')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active')
    }

    const { data, error } = await supabaseClient
      .from('user_plans')
      .insert([
        {
          user_id: userId,
          plan_type: planType,
          status: 'active',
          payment_id: paymentId,
          order_id: orderId,
        },
      ])
      .select()

    if (error) {
      console.error('Error creating user plan:', error)
      throw new Error('Failed to create user plan.')
    }

    const response = { success: true, data }

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
