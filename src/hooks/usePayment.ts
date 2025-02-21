
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loadRazorpayScript } from "@/utils/razorpayLoader";

export const usePayment = (userEmail: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (planType: 'hourly' | 'daily' | 'monthly') => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Please sign in to continue');
      }

      console.log('Creating payment order...');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error || !data?.orderId) {
        console.error('Payment creation error:', error || 'No order ID received');
        throw new Error('Could not create payment order');
      }

      console.log('Payment order created:', data);

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
        theme: {
          color: "#1EAEDB",
        },
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...', response);
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                planType,
                amount: data.amount
              },
            });

            console.log('Verification response:', verifyResponse);

            if (!verifyResponse.data || verifyResponse.error) {
              throw new Error(verifyResponse.error?.message || 'Payment verification failed');
            }

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });

            // Force refresh any open profile dialogs
            window.dispatchEvent(new CustomEvent('plan-updated'));

          } catch (error: any) {
            console.error('Verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Your payment was received but verification failed. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
        },
      };

      // Initialize and open Razorpay
      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setIsLoading(false);
        toast({
          title: "Payment failed",
          description: response.error.description || "Please try again",
          variant: "destructive",
        });
      });

      razorpay.open();
    } catch (error: any) {
      console.error('Payment setup error:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  };

  return {
    isLoading,
    handlePayment,
  };
};
