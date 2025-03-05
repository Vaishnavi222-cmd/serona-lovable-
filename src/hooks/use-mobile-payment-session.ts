
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
      localStorage.setItem(sessionKey, token); // Changed to localStorage
      return token;
    } catch (error) {
      console.error('Error creating payment session:', error);
      return null;
    }
  };

  const validatePaymentSession = () => {
    try {
      const storedToken = localStorage.getItem(sessionKey); // Changed to localStorage
      const isValid = storedToken === sessionRef.current;
      if (!isValid) {
        console.error('Payment session validation failed');
      }
      localStorage.removeItem(sessionKey); // Clean up after validation
      return isValid;
    } catch (error) {
      console.error('Error validating payment session:', error);
      return false;
    }
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem(sessionKey); // Cleanup on unmount
    };
  }, []);

  return {
    createPaymentSession,
    validatePaymentSession
  };
};
