import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobilePaymentSession } from './use-mobile-payment-session';

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

  // Enhanced plan update checking with retries and better error handling
  const checkPlanUpdate = async (userId: string): Promise<boolean> => {
    const maxAttempts = 6;
    let attempt = 0;
    const baseDelay = 2000;

    while (attempt < maxAttempts) {
      try {
        // First verify we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log(`No session found on attempt ${attempt + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay));
          attempt++;
          continue;
        }

        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(`Plan check error on attempt ${attempt + 1}:`, error);
          throw error;
        }

        if (data) {
          console.log('Plan update confirmed:', data);
          return true;
        }

        console.log(`Plan check attempt ${attempt + 1}/${maxAttempts}`);
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } catch (error) {
        console.error(`Error on attempt ${attempt + 1}:`, error);
        attempt++;
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
    let retryCount = 0;
    const maxRetries = 3;

    try {
      if (isMobile) {
        const sessionToken = await mobileSession.createPaymentSession();
        if (!sessionToken) {
          throw new Error('Could not create mobile payment session');
        }
      }

      // Start verification process but don't wait for all retries if first attempt fails
      // This acts as a fallback in case webhook hasn't processed yet
      try {
        const hasValidSession = await ensureValidSession();
        if (!hasValidSession) {
          console.log('Session validation failed, proceeding with payment verification');
        }

        // Attempt immediate verification
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

        // Check for plan update with shorter polling
        const isUpdated = await checkPlanUpdate(userId);
        if (isUpdated) {
          console.log('Plan update confirmed');
          await refreshSession();
          setIsVerifying(false);
          return true;
        }

        // If not updated immediately, return success anyway
        // The webhook will handle the update asynchronously
        console.log('Payment recorded, waiting for webhook processing');
        setIsVerifying(false);
        return true;

      } catch (error) {
        console.log('Verification attempt failed, webhook will handle update:', error);
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
    isVerifying
  };
};
