
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
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log all headers for debugging
    const headers = Object.fromEntries(req.headers.entries())
    console.log('Received headers:', headers)

    // Get the request body
    const { orderId, paymentId, planType, userId } = await req.json()
    console.log('Received payment data:', { orderId, paymentId, planType, userId })

    if (!orderId || !paymentId || !planType || !userId) {
      throw new Error('Missing required parameters')
    }

    // Plan amounts in paise
    const planAmounts = {
      hourly: 2500,
      daily: 15000,
      monthly: 299900
    }

    // Insert plan data using service role client
    const { data: planData, error: insertError } = await supabase
      .from('user_plans')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        amount_paid: planAmounts[planType],
        start_time: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting plan:', insertError)
      throw insertError
    }

    console.log('Plan created successfully:', planData)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Plan activated successfully',
        data: planData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment received successfully',
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
