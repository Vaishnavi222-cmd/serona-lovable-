
import { supabase } from "@/integrations/supabase/client";

export async function createPaymentOrder(planType: 'hourly' | 'daily' | 'monthly') {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) {
    throw new Error('No active session found. Please sign in again.');
  }

  console.log('Creating payment order for plan:', planType);

  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { planType },
  });

  if (error) {
    console.error('Payment creation error:', error);
    throw error;
  }

  if (!data || !data.orderId) {
    console.error('Invalid order data received:', data);
    throw new Error('Could not create payment order. Please try again.');
  }

  return data;
}

export async function verifyPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  planType: 'hourly' | 'daily' | 'monthly';
}) {
  const { error } = await supabase.functions.invoke('verify-payment', {
    body: params,
  });

  if (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}
