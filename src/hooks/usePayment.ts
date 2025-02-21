
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
      // Create payment order
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

      // Create Razorpay options
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
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
          confirm_close: false,
          escape: false,
          animation: true,
          backdropClose: false,
          handleBack: true,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        send_sms_hash: true,
        remember_customer: true,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...', response);
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planType,
              },
            });

            console.log('Verification response:', verifyResponse);

            if (verifyResponse.error) {
              console.error('Verification error:', verifyResponse.error);
              throw new Error(verifyResponse.error.message || 'Payment verification failed');
            }

            if (!verifyResponse.data?.success) {
              console.error('Verification unsuccessful:', verifyResponse.data);
              throw new Error('Payment verification unsuccessful');
            }

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });

          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Your payment was received but verification failed. Our team will verify manually.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        },
      };

      // Create and open Razorpay instance
      try {
        console.log('Creating Razorpay instance...');
        const razorpay = new (window as any).Razorpay(options);

        razorpay.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error);
          setIsLoading(false);
          toast({
            title: "Payment failed",
            description: response.error.description || "Please try again or use a different payment method",
            variant: "destructive",
          });
        });

        console.log('Opening Razorpay modal...');
        razorpay.open();
      } catch (error) {
        console.error('Error creating/opening Razorpay:', error);
        throw new Error('Failed to open payment window. Please try again.');
      }
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
