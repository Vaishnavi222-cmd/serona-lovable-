
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Razorpay from 'npm:razorpay@2.9.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ebookId } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!supabaseUrl || !supabaseKey || !razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get ebook details
    const { data: ebook, error: ebookError } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', ebookId)
      .single()

    if (ebookError || !ebook) {
      throw new Error('Ebook not found')
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: ebook.price * 100, // Convert to paise
      currency: 'INR',
    })

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('ebook_purchases')
      .insert([{
        ebook_id: ebookId,
        order_id: order.id,
        amount_paid: ebook.price,
        purchase_status: 'pending'
      }])
      .select()
      .single()

    if (purchaseError) {
      throw new Error('Failed to create purchase record')
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        keyId: razorpayKeyId,
        amount: ebook.price * 100,
        currency: 'INR',
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
