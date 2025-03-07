
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useMobilePaymentSession = () => {
  const sessionKey = 'mobile_payment_session';
  const sessionRef = useRef<string | null>(null);

  const createPaymentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('No valid session found, attempting refresh...');
        await supabase.auth.refreshSession();
        const { data: { session: refreshedSession } } = await supabase.auth.getSession();
        if (!refreshedSession?.user?.id) {
          console.error('Failed to get valid session after refresh');
          return null;
        }
      }
      
      const token = `${session.user.id}_${Date.now()}`;
      sessionRef.current = token;
      localStorage.setItem(sessionKey, token);
      return token;
    } catch (error) {
      console.error('Error creating payment session:', error);
      return null;
    }
  };

  const validatePaymentSession = () => {
    try {
      const storedToken = localStorage.getItem(sessionKey);
      const isValid = storedToken === sessionRef.current;
      localStorage.removeItem(sessionKey);
      
      if (!isValid) {
        console.warn('Payment session validation failed, but continuing for mobile flow');
      }
      
      return isValid;
    } catch (error) {
      console.error('Error validating payment session:', error);
      return false;
    }
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem(sessionKey);
    };
  }, []);

  return {
    createPaymentSession,
    validatePaymentSession
  };
};
