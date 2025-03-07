
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePlanUpdates = (userId: string | undefined, onUpdate: () => void) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('plan-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_plans',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
};
