import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';

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

    // For desktop, keep existing flow
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

    // Mobile-specific verification with session handling
    while (retryCount < maxRetries) {
      try {
        // Ensure we have a fresh session for mobile
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Try to refresh the session
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (!refreshedSession) {
            throw new Error('Session expired');
          }
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

        // Enhanced plan update check for mobile
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
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
  };

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

  return {
    verifyPayment,
    isVerifying
  };
};
