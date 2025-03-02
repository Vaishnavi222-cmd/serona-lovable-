
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { timingSafeEqual } from 'https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔄 Payment verification function started');
  console.log('Request method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json();
    console.log('📝 Received request body:', JSON.stringify(requestBody, null, 2));

    const { orderId, paymentId, signature } = requestBody;
    console.log('🔍 Extracted payment details:', { orderId, paymentId, signature });

    if (!orderId?.trim() || !paymentId?.trim() || !signature?.trim()) {
      console.error('❌ Missing required fields:', { orderId, paymentId, signature });
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();

    if (!supabaseUrl || !supabaseKey || !razorpayKeySecret) {
      console.error('❌ Environment variables check failed:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasRazorpaySecret: !!razorpayKeySecret
      });
      throw new Error('Server configuration error');
    }

    console.log('✅ Environment variables validated');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate HMAC signature
    const message = `${orderId}|${paymentId}`;
    console.log('🔐 Generating signature for message:', message);

    const key = new TextEncoder().encode(razorpayKeySecret);
    const data = new TextEncoder().encode(message);

    const hmacKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", hmacKey, data);
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('🔑 Signature comparison:', {
      generated: generatedSignature,
      received: signature,
    });

    const isValidSignature = timingSafeEqual(
      new TextEncoder().encode(generatedSignature.toLowerCase()),
      new TextEncoder().encode(signature.toLowerCase())
    );

    if (!isValidSignature) {
      console.error('❌ Signature verification failed');
      throw new Error('Invalid payment signature');
    }

    console.log('✅ Signature verified successfully');

    // Fetch current purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('ebook_purchases')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (purchaseError || !purchase) {
      console.error('❌ Purchase record error:', purchaseError);
      console.log('Purchase data:', purchase);
      throw new Error('Purchase record not found');
    }

    console.log('📚 Found purchase record:', purchase);

    // Generate signed URL using the correct bucket and file
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    console.log('⏰ Generating signed URL with expiry:', expiryTime.toISOString());

    const { data: signedUrl, error: signedUrlError } = await supabase
      .storage
      .from('ebook_storage') // Use the correct bucket name
      .createSignedUrl('ebook_decision_making.pdf', 300); // Use the correct file name, 300 seconds = 5 minutes

    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error('❌ Signed URL generation error:', signedUrlError);
      throw new Error('Failed to generate download URL');
    }

    console.log('🔗 Generated signed URL successfully');

    // Update purchase record
    const updateData = {
      payment_id: paymentId,
      purchase_status: 'completed',
      download_url: signedUrl.signedUrl,
      url_expires_at: expiryTime.toISOString()
    };

    console.log('📝 Updating purchase record with:', updateData);

    const { error: updateError } = await supabase
      .from('ebook_purchases')
      .update(updateData)
      .eq('order_id', orderId);

    if (updateError) {
      console.error('❌ Purchase record update error:', updateError);
      throw new Error('Failed to update purchase record');
    }

    console.log('✅ Purchase record updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signedUrl.signedUrl,
        expiresAt: expiryTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Server error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
