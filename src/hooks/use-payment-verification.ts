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

  // Enhanced plan update checking with background sync for mobile
  const checkPlanUpdate = async (userId: string): Promise<boolean> => {
    const maxAttempts = 30; // Increased for mobile
    let attempt = 0;
    const baseDelay = 3000;

    while (attempt < maxAttempts) {
      try {
        // Check connection
        if (!navigator.onLine) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // Refresh session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Session expired');
        }

        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) return true;

        const delay = baseDelay * Math.pow(1.5, attempt);
        console.log(`Plan check attempt ${attempt + 1}/${maxAttempts}: Waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } catch (error) {
        console.error('Plan check error:', error);
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

    // For desktop, keep existing flow completely untouched
    if (!isMobile) {
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

    // Mobile-specific verification with enhanced session handling
    try {
      // Enhanced session retrieval with retries
      let session = null;
      let sessionRetries = 0;
      const maxSessionRetries = 3;
      
      while (!session?.user?.id && sessionRetries < maxSessionRetries) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        
        if (!session?.user?.id) {
          sessionRetries++;
          console.log(`Session retry attempt ${sessionRetries}`);
          if (sessionRetries < maxSessionRetries) {
            await new Promise(resolve => setTimeout(resolve, sessionRetries * 100));
          }
        }
      }

      if (!session?.user?.id) {
        setIsVerifying(false);
        throw new Error('Could not retrieve valid session after multiple attempts');
      }

      if (!await mobileSession.createPaymentSession()) {
        setIsVerifying(false);
        throw new Error('Failed to create mobile payment session');
      }

      while (retryCount < maxRetries) {
        try {
          if (!mobileSession.validatePaymentSession()) {
            throw new Error('Invalid mobile payment session');
          }

          // Store user ID from the validated session for all subsequent operations
          const currentUserId = session.user.id;

          // First, explicitly mark any existing active plan as expired
          await supabase
            .from('user_plans')
            .update({ status: 'expired' })
            .eq('user_id', currentUserId)
            .eq('status', 'active');

          // Add a delay before verification to ensure database sync
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Verify payment using stored user ID
          const verifyResponse = await supabase.functions.invoke('verify-payment', {
            body: {
              orderId,
              paymentId,
              signature,
              planType,
              userId: currentUserId
            }
          });

          if (verifyResponse.error) {
            throw verifyResponse.error;
          }

          // Wait longer for mobile plan update to complete
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Use stored user ID for plan update check
          const isUpdated = await checkPlanUpdate(currentUserId);
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

          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    } catch (error: any) {
      setIsVerifying(false);
      throw error;
    }
  };

  return {
    verifyPayment,
    isVerifying
  };
};
