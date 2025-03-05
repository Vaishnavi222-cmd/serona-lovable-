
import { useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useMobilePaymentSession = () => {
  const sessionKey = 'mobile_payment_session';
  const sessionRef = useRef<string | null>(null);

  const createPaymentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    
    const token = `${session.user.id}_${Date.now()}`;
    sessionRef.current = token;
    localStorage.setItem(sessionKey, token);
    return token;
  };

  const validatePaymentSession = () => {
    const storedToken = localStorage.getItem(sessionKey);
    const isValid = storedToken === sessionRef.current;
    localStorage.removeItem(sessionKey); // Clean up after validation
    return isValid;
  };

  useEffect(() => {
    return () => {
      localStorage.removeItem(sessionKey); // Cleanup on unmount
    };
  }, []);

  return {
    createPaymentSession,
    validatePaymentSession,
  };
};
