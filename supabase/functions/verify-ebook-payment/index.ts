
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { timingSafeEqual } from 'https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Safely parse JSON request body
    let orderId, paymentId, signature;
    try {
      const body = await req.json()
      ;({ orderId, paymentId, signature } = body)
      
      if (!orderId?.trim() || !paymentId?.trim() || !signature?.trim()) {
        throw new Error('Missing required fields')
      }
    } catch (error) {
      console.error('Request parsing error:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl?.trim() || !supabaseKey?.trim() || !razorpayKeySecret?.trim()) {
      console.error('Missing or invalid environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate HMAC signature
    const message = orderId + "|" + paymentId
    const key = new TextEncoder().encode(razorpayKeySecret)
    const data = new TextEncoder().encode(message)
    
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      hmacKey,
      data
    )
    
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Verifying signatures...')
    
    // Secure signature comparison using timing-safe equals
    const isValidSignature = timingSafeEqual(
      new TextEncoder().encode(generatedSignature.toLowerCase()),
      new TextEncoder().encode(signature.toLowerCase())
    )

    if (!isValidSignature) {
      console.error('Signature verification failed')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid payment signature' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('ebook_purchases')
      .select('*, ebooks(*)')
      .eq('order_id', orderId)
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase record error:', purchaseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Purchase record not found' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate signed URL valid for 5 minutes
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('ebooks')
      .createSignedUrl(purchase.ebooks.file_path, 300)

    if (signedUrlError) {
      console.error('Signed URL generation error:', signedUrlError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate download URL' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update purchase record
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000)
    const { error: updateError } = await supabase
      .from('ebook_purchases')
      .update({
        payment_id: paymentId,
        purchase_status: 'completed',
        download_url: signedUrl.signedUrl,
        url_expires_at: expiryTime.toISOString()
      })
      .eq('order_id', orderId)

    if (updateError) {
      console.error('Purchase record update error:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update purchase record' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Payment verification successful')
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl.signedUrl,
        expiresAt: expiryTime.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
