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

      while (retryCount < maxRetries) {
        try {
          // Always ensure valid session before proceeding
          const hasValidSession = await ensureValidSession();
          if (!hasValidSession) {
            throw new Error('Could not establish valid session');
          }

          // For mobile, use direct HTTP request
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
              const error = await response.json();
              throw new Error(error.message || 'Payment verification failed');
            }
          } else {
            // Desktop flow remains unchanged
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
              throw verifyResponse.error;
            }
          }

          // Wait for plan update with enhanced polling
          const isUpdated = await checkPlanUpdate(userId);
          if (!isUpdated) {
            throw new Error('Plan update verification failed');
          }

          // Final session refresh after successful verification
          await refreshSession();
          
          console.log('Payment verification and session refresh successful');
          setIsVerifying(false);
          return true;

        } catch (error: any) {
          console.error(`Verification attempt ${retryCount + 1} failed:`, error);
          retryCount++;

          if (retryCount === maxRetries) {
            setIsVerifying(false);
            throw error;
          }

          await new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000))
          );
        }
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      setIsVerifying(false);
      throw error;
    }
  };

  return {
    verifyPayment,
    isVerifying
  };
};
