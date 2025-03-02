
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from 'npm:razorpay@2.9.2'
import { createHmac } from 'https://deno.land/std@0.182.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { orderId, paymentId, signature } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl || !supabaseKey || !razorpayKeySecret) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify payment signature
    const hmac = createHmac('sha256', razorpayKeySecret)
    hmac.update(`${orderId}|${paymentId}`)
    const generatedSignature = hmac.digest('hex')

    if (generatedSignature !== signature) {
      throw new Error('Invalid payment signature')
    }

    // Get purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('ebook_purchases')
      .select('*, ebooks(*)')
      .eq('order_id', orderId)
      .single()

    if (purchaseError || !purchase) {
      throw new Error('Purchase record not found')
    }

    // Generate signed URL valid for 5 minutes
    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('ebooks')
      .createSignedUrl(purchase.ebooks.file_path, 300)

    if (signedUrlError) {
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
      throw new Error('Failed to update purchase record')
    }

    return new Response(
      JSON.stringify({
        downloadUrl: signedUrl.signedUrl,
        expiresAt: expiryTime.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
