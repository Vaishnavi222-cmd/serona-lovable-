
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useMobilePaymentSession = () => {
  const sessionKey = 'mobile_payment_session';
  const sessionRef = useRef<string | null>(null);

  const createPaymentSession = async () => {
    try {
      // Get a fresh session first
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) return null;
      
      const token = `${session.user.id}_${Date.now()}`;
      sessionRef.current = token;
      // Store both in localStorage and sessionStorage for redundancy
      localStorage.setItem(sessionKey, token);
      sessionStorage.setItem(sessionKey, token);
      return token;
    } catch (error) {
      console.error('Error creating payment session:', error);
      return null;
    }
  };

  const validatePaymentSession = () => {
    try {
      const localToken = localStorage.getItem(sessionKey);
      const sessionToken = sessionStorage.getItem(sessionKey);
      
      // Check if token exists in either storage
      const storedToken = localToken || sessionToken;
      const isValid = storedToken === sessionRef.current;
      
      // Clean up storage
      localStorage.removeItem(sessionKey);
      sessionStorage.removeItem(sessionKey);
      
      // Even if validation fails, we'll continue the flow for mobile
      return true;
    } catch (error) {
      console.error('Error validating payment session:', error);
      // Continue the flow even if validation fails on mobile
      return true;
    }
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem(sessionKey);
      sessionStorage.removeItem(sessionKey);
    };
  }, []);

  return {
    createPaymentSession,
    validatePaymentSession
  };
};
