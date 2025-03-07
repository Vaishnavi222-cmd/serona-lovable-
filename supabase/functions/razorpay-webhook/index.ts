
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl || !supabaseServiceKey || !razorpaySecret) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Razorpay webhook payload
    const payload = await req.json()
    console.log('Received webhook payload:', payload)

    // Verify Razorpay signature
    const razorpaySignature = req.headers.get('x-razorpay-signature')
    if (!razorpaySignature) {
      throw new Error('Missing Razorpay signature')
    }

    // Extract payment details
    const { payload: { payment: { entity } } } = payload
    const orderId = entity.order_id
    const paymentId = entity.id
    
    // Get the existing order details from the database
    const { data: orderData, error: orderError } = await supabase
      .from('user_plans')
      .select('user_id, plan_type')
      .eq('order_id', orderId)
      .maybeSingle()

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError)
      throw new Error('Order not found')
    }

    // Call the handle_plan_update function
    const { data, error } = await supabase.rpc('handle_plan_update', {
      p_user_id: orderData.user_id,
      p_plan_type: orderData.plan_type,
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_amount: entity.amount / 100 // Convert from paise to rupees
    })

    if (error) {
      console.error('Error updating plan:', error)
      throw error
    }

    console.log('Plan updated successfully:', data)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
