
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

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
    const { orderId, paymentId, signature } = await req.json()
    console.log('Received payment verification request:', { orderId, paymentId, signature })
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl || !supabaseKey || !razorpayKeySecret) {
      console.error('Missing environment variables')
      throw new Error('Configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate the expected signature
    const message = orderId + "|" + paymentId
    const key = new TextEncoder().encode(razorpayKeySecret)
    const data = new TextEncoder().encode(message)
    
    // Create HMAC signature using SHA-256
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

    console.log('Generated signature:', generatedSignature)
    console.log('Received signature:', signature)

    // Verify signature
    if (generatedSignature !== signature) {
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
      throw new Error('Purchase record not found')
    }

    // Generate signed URL valid for 5 minutes
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('ebooks')
      .createSignedUrl(purchase.ebooks.file_path, 300)

    if (signedUrlError) {
      console.error('Signed URL generation error:', signedUrlError)
      throw new Error('Failed to generate download URL')
    }

    // Update purchase record
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
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
      throw new Error('Failed to update purchase record')
    }

    console.log('Payment verification successful')
    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl.signedUrl,
        expiresAt: expiryTime.toISOString(),
        redirectUrl: `/download-success`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Verification failed' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
