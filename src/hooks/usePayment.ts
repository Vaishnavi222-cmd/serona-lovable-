
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePayment(userEmail: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (planType: 'hourly' | 'daily' | 'monthly') => {
    try {
      setIsLoading(true);
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      // Create payment order
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error || !data?.orderId) {
        throw new Error('Could not create payment order. Please try again.');
      }

      // Configure Razorpay
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Serona AI",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        order_id: data.orderId,
        prefill: {
          email: userEmail,
        },
        handler: async function (response: any) {
          try {
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                planType,
              },
            });

            if (verifyResponse.error) {
              throw new Error(verifyResponse.error);
            }

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Error verifying payment",
              description: error.message || "Please contact support if the issue persists",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment setup error:', error);
      toast({
        title: "Error setting up payment",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { isLoading, handlePayment };
}
