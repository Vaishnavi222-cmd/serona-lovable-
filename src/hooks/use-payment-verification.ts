import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobilePaymentSession } from './use-mobile-payment-session';
import { usePaymentVerificationRetry } from './use-payment-verification-retry';

interface PaymentVerificationProps {
  userId: string;
  planType: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

export const usePaymentVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const mobileSession = useMobilePaymentSession();
  const { retryVerification, isRetrying } = usePaymentVerificationRetry();

  // Enhanced session refresh mechanism
  const refreshSession = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        // Even if refresh fails, try to get current session
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
      }
      return !!data.session;
    } catch (error) {
      console.error('Session refresh attempt failed:', error);
      return false;
    }
  };

  // Helper to verify and refresh session with retries
  const ensureValidSession = async (): Promise<boolean> => {
    let retries = 3;
    while (retries > 0) {
      const isValid = await refreshSession();
      if (isValid) return true;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  };

  const verifyPayment = async ({
    userId,
    planType,
    orderId,
    paymentId,
    signature
  }: PaymentVerificationProps) => {
    setIsVerifying(true);

    try {
      if (isMobile) {
        const sessionToken = await mobileSession.createPaymentSession();
        if (!sessionToken) {
          throw new Error('Could not create mobile payment session');
        }
      }

      // Initial verification attempt
      try {
        const hasValidSession = await ensureValidSession();
        if (!hasValidSession) {
          console.log('Session validation failed, proceeding with payment verification');
        }

        if (isMobile) {
          const response = await fetch('https://ptpxhzfjfssaxilyuwzd.supabase.co/functions/v1/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              userId,
              planType,
              orderId,
              paymentId,
              signature,
              isMobile: true
            }),
          });

          if (!response.ok) {
            console.log('Initial verification failed, webhook will handle update');
          }
        } else {
          const verifyResponse = await supabase.functions.invoke('verify-payment', {
            body: {
              orderId,
              paymentId,
              signature,
              planType,
              userId
            }
          });

          if (verifyResponse.error) {
            console.log('Initial verification failed, webhook will handle update');
          }
        }

        // Start retry mechanism
        retryVerification({ userId, orderId }).catch(error => {
          console.error('Retry mechanism error:', error);
        });

        // Return success immediately - webhook and retry mechanism will handle the update
        setIsVerifying(false);
        return true;

      } catch (error) {
        console.log('Verification attempt failed, webhook will handle update:', error);
        
        // Start retry mechanism even if initial verification fails
        retryVerification({ userId, orderId }).catch(error => {
          console.error('Retry mechanism error:', error);
        });
        
        setIsVerifying(false);
        return true; // Return true since webhook will handle it
      }

    } catch (error: any) {
      console.error('Critical payment verification error:', error);
      setIsVerifying(false);
      throw error;
    }
  };

  return {
    verifyPayment,
    isVerifying: isVerifying || isRetrying
  };
};
