
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDailyReset = (onReset: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('daily-reset')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_daily_usage',
        },
        () => {
          onReset();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onReset]);
};
