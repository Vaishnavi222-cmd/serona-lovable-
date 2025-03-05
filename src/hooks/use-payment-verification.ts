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

  // Enhanced plan update checking with retries and better error handling
  const checkPlanUpdate = async (userId: string): Promise<boolean> => {
    const maxAttempts = 6; // Increased for mobile
    let attempt = 0;
    const baseDelay = 2000; // 2 seconds base delay

    while (attempt < maxAttempts) {
      try {
        // First verify we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, retrying...');
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
          console.error('Plan check error:', error);
          throw error;
        }

        // If we found an active plan, verification successful
        if (data) {
          console.log('Plan update confirmed:', data);
          return true;
        }

        console.log(`Plan check attempt ${attempt + 1}/${maxAttempts}`);
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } catch (error) {
        console.error(`Plan check attempt ${attempt + 1} failed:`, error);
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

    // For mobile payments, we need extra verification steps
    if (isMobile) {
      try {
        // First ensure we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          // Try to refresh the session
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (!refreshData.session) {
            throw new Error('Could not restore session');
          }
        }

        // Create mobile payment session
        if (!await mobileSession.createPaymentSession()) {
          throw new Error('Failed to create mobile payment session');
        }

        // Verify the payment with retries
        while (retryCount < maxRetries) {
          try {
            // Validate mobile session
            if (!mobileSession.validatePaymentSession()) {
              throw new Error('Invalid mobile payment session');
            }

            // Verify payment with edge function
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

            // Wait for plan update with enhanced polling
            const isUpdated = await checkPlanUpdate(userId);
            if (!isUpdated) {
              throw new Error('Plan update verification failed');
            }

            setIsVerifying(false);
            return true;
          } catch (error: any) {
            console.error(`Mobile verification attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount === maxRetries) {
              setIsVerifying(false);
              throw error;
            }

            // Exponential backoff between retries
            await new Promise(resolve => 
              setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000))
            );
          }
        }
      } catch (error: any) {
        console.error('Mobile payment verification failed:', error);
        setIsVerifying(false);
        throw error;
      }
    } else {
      // Keep existing desktop flow
      while (retryCount < maxRetries) {
        try {
          // Check connection before proceeding
          if (!navigator.onLine) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
  
          // Refresh session before verification
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Session expired');
          }
  
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
  
          // Wait for plan update with exponential backoff
          const isUpdated = await checkPlanUpdate(userId);
          if (!isUpdated) {
            throw new Error('Plan update verification failed');
          }
  
          setIsVerifying(false);
          return true;
        } catch (error: any) {
          console.error(`Verification attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount === maxRetries) {
            setIsVerifying(false);
            throw error;
          }
          
          // Exponential backoff between retries
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }
  };

  return {
    verifyPayment,
    isVerifying
  };
};
