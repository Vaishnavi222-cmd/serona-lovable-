
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export function useRazorpayLoader() {
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = useCallback(async (maxRetries = 3) => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      setIsRazorpayLoaded(true);
      return true;
    }

    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await new Promise<void>((resolve, reject) => {
          // Remove any existing script to prevent duplicates
          const existingScript = document.getElementById('razorpay-script');
          if (existingScript) {
            existingScript.remove();
          }

          const script = document.createElement('script');
          script.id = 'razorpay-script';
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;

          script.onload = () => {
            console.log('Razorpay script loaded successfully');
            setIsRazorpayLoaded(true);
            resolve();
          };

          script.onerror = (error) => {
            console.error(`Failed to load Razorpay script (attempt ${retryCount + 1}):`, error);
            reject(error);
          };

          document.body.appendChild(script);
        });

        return true; // Script loaded successfully
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          console.error('Failed to load Razorpay after all retries');
          toast({
            title: "Payment system error",
            description: "Unable to initialize payment system. Please refresh and try again.",
            variant: "destructive",
          });
          return false;
        }
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000))
        );
      }
    }
    return false;
  }, [toast]);

  return {
    isRazorpayLoaded,
    loadRazorpayScript
  };
}
