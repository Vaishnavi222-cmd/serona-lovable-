
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VerificationRetryProps {
  userId: string;
  orderId: string;
}

export const usePaymentVerificationRetry = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const checkPlanUpdate = async (userId: string): Promise<boolean> => {
    try {
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
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking plan:', error);
      return false;
    }
  };

  const retryVerification = useCallback(async ({ userId, orderId }: VerificationRetryProps) => {
    setIsRetrying(true);
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 5000; // 5 seconds between retries

    try {
      while (attempts < maxAttempts) {
        console.log(`Retry attempt ${attempts + 1}/${maxAttempts} for order ${orderId}`);
        
        const isUpdated = await checkPlanUpdate(userId);
        if (isUpdated) {
          console.log('Plan update confirmed on retry');
          setIsRetrying(false);
          return true;
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (attempts >= maxAttempts) {
        console.log('Max retry attempts reached');
        toast({
          title: "Plan activation in progress",
          description: "Your plan will be activated shortly. You can refresh the page to check the status.",
          duration: 10000,
        });
      }

      return false;
    } catch (error) {
      console.error('Retry verification error:', error);
      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [toast]);

  return {
    retryVerification,
    isRetrying
  };
};
