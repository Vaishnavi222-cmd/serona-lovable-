
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
    const { planType } = await req.json()
    
    if (!planType) {
      throw new Error('Plan type is required')
    }

    // Get plan amount in paise
    const planAmounts = {
      hourly: 2500,    // ₹25.00
      daily: 15000,    // ₹150.00
      monthly: 299900  // ₹2,999.00
    }

    const amount = planAmounts[planType]
    if (!amount) {
      throw new Error('Invalid plan type')
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!keyId || !keySecret) {
      throw new Error('Missing Razorpay credentials')
    }

    // Create order with enhanced error handling
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(keyId + ':' + keySecret),
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Razorpay API error:', errorData)
      throw new Error(`Razorpay API error: ${response.status} - ${errorData.error?.description || 'Unknown error'}`)
    }

    const data = await response.json()

    // Strict validation for order ID
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format from Razorpay:', data)
      throw new Error('Invalid response format from Razorpay')
    }

    if (!data.id || typeof data.id !== 'string') {
      console.error('Missing or invalid order ID from Razorpay:', data)
      throw new Error('Failed to create payment order: Invalid order ID')
    }

    console.log('Order created successfully:', { 
      orderId: data.id, 
      amount: amount,
      planType 
    })

    return new Response(
      JSON.stringify({
        orderId: data.id,
        keyId: keyId,
        amount: amount,
        currency: 'INR',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Create payment error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    )
  }
})
