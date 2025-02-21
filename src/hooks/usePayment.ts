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
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      console.log('Creating payment order...');
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
      if (!data || !data.orderId) {
        console.error('Invalid response from create-payment:', data);
        throw new Error('Could not create payment order. Please try again.');
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
                signature: response.razorpay_signature,
                planType,
                amount: data.amount // Pass the amount to store
              },
            });

            console.log('Verification response:', verifyResponse);

            if (verifyResponse.error) {
              throw new Error(verifyResponse.error.message || 'Payment verification failed');
            }

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });

            // Force refresh the profile dialog if it's open
            const event = new CustomEvent('plan-updated');
            window.dispatchEvent(event);

          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Error activating plan",
              description: error.message || "Please contact support if payment was deducted",
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
        title: "Error setting up payment",
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
