
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { orderId, paymentId, signature, planType } = await req.json()
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!orderId || !paymentId || !signature || !planType || !keySecret) {
      throw new Error('Missing required parameters')
    }

    console.log('Verifying payment:', { orderId, paymentId, planType })

    // Generate signature for verification
    const text = orderId + '|' + paymentId
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const key = encoder.encode(keySecret)
    const hmacSignature = new Uint8Array(
      await crypto.subtle.sign(
        { name: 'HMAC', hash: 'SHA-256' },
        await crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        ),
        data
      )
    )

    // Convert to base64
    const generatedSignature = btoa(String.fromCharCode(...hmacSignature))

    console.log('Signature verification:', {
      provided: signature,
      generated: generatedSignature,
      match: signature === generatedSignature
    })

    if (signature !== generatedSignature) {
      throw new Error('Invalid signature')
    }

    // Get user ID from auth token
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

    // Insert new plan
    const { error: insertError } = await supabase
      .from('user_plans')
      .insert([
        {
          user_id: user.id,
          plan_type: planType,
          status: 'active',
        }
      ])

    if (insertError) {
      console.error('Plan insertion error:', insertError)
      throw new Error('Failed to create plan')
    }

    console.log('Payment verified and plan created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and plan activated' 
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
