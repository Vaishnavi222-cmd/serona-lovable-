
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useMobilePaymentSession = () => {
  const sessionKey = 'mobile_payment_session';
  const sessionRef = useRef<string | null>(null);

  const createPaymentSession = async () => {
    try {
      // Get a fresh session
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) return null;
      
      const token = `${session.user.id}_${Date.now()}`;
      sessionRef.current = token;
      sessionStorage.setItem(sessionKey, token);
      return token;
    } catch (error) {
      console.error('Error creating payment session:', error);
      return null;
    }
  };

  const validatePaymentSession = () => {
    try {
      const storedToken = sessionStorage.getItem(sessionKey);
      const isValid = storedToken === sessionRef.current;
      if (!isValid) {
        console.error('Payment session validation failed');
      }
      sessionStorage.removeItem(sessionKey); // Clean up after validation
      return isValid;
    } catch (error) {
      console.error('Error validating payment session:', error);
      return false;
    }
  };

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(sessionKey); // Cleanup on unmount
    };
  }, []);

  return {
    createPaymentSession,
    validatePaymentSession
  };
};
