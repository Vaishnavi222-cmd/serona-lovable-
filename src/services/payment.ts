
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'hourly' | 'daily' | 'monthly';

interface PlanDetails {
  type: PlanType;
  amount: number;
  description: string;
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  hourly: {
    type: 'hourly',
    amount: 2500, // 25.00 INR in paise
    description: 'Hourly Plan - 1 hour access with 9,000 output tokens',
  },
  daily: {
    type: 'daily',
    amount: 15000, // 150.00 INR in paise
    description: 'Daily Plan - 12 hours access with 108,000 output tokens',
  },
  monthly: {
    type: 'monthly',
    amount: 299900, // 2,999.00 INR in paise
    description: 'Monthly Plan - 30 days access with 3,240,000 output tokens',
  },
};

export async function createPaymentOrder(planType: PlanType) {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { planType },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
}

export async function verifyPayment(orderId: string, paymentId: string, signature: string) {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { orderId, paymentId, signature },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}
