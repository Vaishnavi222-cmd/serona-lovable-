
import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface RazorpayContextType {
  razorpayLoaded: boolean;
  initializePayment: (options: any) => void;
}

const RazorpayContext = createContext<RazorpayContextType>({
  razorpayLoaded: false,
  initializePayment: () => {},
});

export function RazorpayProvider({ children }: { children: React.ReactNode }) {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadRazorpay = async () => {
      if (!document.getElementById('razorpay-script')) {
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          setRazorpayLoaded(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          setRazorpayLoaded(false);
          toast({
            title: "Payment system failed to load",
            description: "Please refresh the page and try again",
            variant: "destructive",
          });
        };
        
        document.body.appendChild(script);
      } else {
        setRazorpayLoaded(true);
      }
    };

    loadRazorpay();
  }, [toast]);

  const initializePayment = (options: any) => {
    if (!razorpayLoaded) {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <RazorpayContext.Provider value={{ razorpayLoaded, initializePayment }}>
      {children}
    </RazorpayContext.Provider>
  );
}

export const useRazorpay = () => useContext(RazorpayContext);
