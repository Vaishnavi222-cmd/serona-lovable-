
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
    // Parse JSON request body safely
    const { orderId, paymentId, signature } = await req.json()
    console.log('Received payment verification request:', { orderId, paymentId, signature })

    if (!orderId?.trim() || !paymentId?.trim() || !signature?.trim()) {
      throw new Error('Missing required fields')
    }

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim()

    if (!supabaseUrl || !supabaseKey || !razorpayKeySecret) {
      console.error('Missing or invalid environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate HMAC signature using SHA-256
    const message = `${orderId}|${paymentId}`
    const key = new TextEncoder().encode(razorpayKeySecret)
    const data = new TextEncoder().encode(message)

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signatureBuffer = await crypto.subtle.sign("HMAC", hmacKey, data)
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Generated signature:', generatedSignature)
    console.log('Received signature:', signature)

    // Secure signature comparison
    const isValidSignature = timingSafeEqual(
      new TextEncoder().encode(generatedSignature.toLowerCase()),
      new TextEncoder().encode(signature.toLowerCase())
    )

    if (!isValidSignature) {
      console.error('Signature verification failed')
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payment signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch purchase record from Supabase
    const { data: purchase, error: purchaseError } = await supabase
      .from('ebook_purchases')
      .select('*, ebooks(file_path)')
      .eq('order_id', orderId)
      .single()

    if (purchaseError || !purchase?.ebooks?.file_path) {
      console.error('Purchase record error:', purchaseError)
      return new Response(
        JSON.stringify({ success: false, error: 'Purchase record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate signed URL valid for 5 minutes
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000)
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('ebooks')
      .createSignedUrl(purchase.ebooks.file_path, 300) // 300 seconds = 5 minutes

    if (signedUrlError) {
      console.error('Signed URL generation error:', signedUrlError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update purchase record with payment verification and download URL
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
        JSON.stringify({ success: false, error: 'Failed to update purchase record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Payment verification successful')
    
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl.signedUrl,
        expiresAt: expiryTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
