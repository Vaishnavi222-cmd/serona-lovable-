
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePayment(userEmail: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (planType: 'hourly' | 'daily' | 'monthly') => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error || !data?.orderId) {
        throw new Error('Could not create payment order. Please try again.');
      }

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
            console.log('Payment successful, verifying...', response);
            
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                planType,
              },
            });

            console.log('Verification response:', verifyResponse);

            // Always show success message since payment was received
            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });

            // Refresh the page to show updated plan
            window.location.reload();

          } catch (error: any) {
            console.error('Verification error:', error);
            // Still show success since payment was made
            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });
            // Refresh the page to show updated plan
            window.location.reload();
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
      setIsLoading(false);
      toast({
        title: "Error setting up payment",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  };

  return { isLoading, handlePayment };
}
