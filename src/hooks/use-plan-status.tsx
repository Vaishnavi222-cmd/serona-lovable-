
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePlanStatus(userId: string | undefined) {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [dailyUsage, setDailyUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function checkPlanStatus() {
      try {
        // Check for active paid plan
        const { data: planData } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('end_time', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get today's usage for free plan
        const today = new Date().toISOString().split('T')[0];
        const { data: usageData } = await supabase
          .from('user_daily_usage')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        setActivePlan(planData);
        setDailyUsage(usageData);
      } catch (error) {
        console.error('Error checking plan status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkPlanStatus();
  }, [userId]);

  const checkUsageLimit = (requiresDetailedResponse: boolean = false) => {
    if (activePlan) {
      if (activePlan.remaining_output_tokens <= 0 || 
          new Date(activePlan.end_time) < new Date()) {
        toast({
          title: "Plan limit reached",
          description: "Your plan has expired or run out of tokens. Please upgrade to continue.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }

    // Free plan checks
    if (!dailyUsage) return true;

    if (dailyUsage.responses_count >= 7) {
      toast({
        title: "Daily limit reached",
        description: "You've reached your daily limit. Please upgrade or wait until tomorrow.",
        variant: "destructive",
      });
      return false;
    }

    const maxTokens = requiresDetailedResponse ? 800 : 400;
    if (dailyUsage.output_tokens_used > maxTokens) {
      toast({
        title: "Token limit reached",
        description: "You've exceeded the token limit for free responses.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    activePlan,
    dailyUsage,
    isLoading,
    checkUsageLimit,
  };
}
