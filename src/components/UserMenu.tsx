import { useState, useEffect, useCallback } from 'react';
import { LogOut, User, Crown } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UpgradePlansDialog } from "@/components/ui/upgrade-plans-dialog";
import { UserProfileDialog } from "@/components/ui/user-profile-dialog";
import { usePaymentVerification } from "@/hooks/use-payment-verification";

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();
  const { verifyPayment, isVerifying } = usePaymentVerification();

  // Enhanced Razorpay script loading with better error handling
  const loadRazorpayScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (typeof (window as any).Razorpay !== 'undefined') {
        setIsRazorpayLoaded(true);
        resolve();
        return;
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
        console.error('Failed to load Razorpay script:', error);
        reject(new Error('Failed to load payment system'));
      };

      document.body.appendChild(script);
    });
  }, []);

  // Enhanced session verification
  const verifySession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('No active session found. Please sign in again.');
    }
    return session;
  };

  // Enhanced polling with exponential backoff
  const pollForPlanUpdate = async (userId: string, maxAttempts = 20): Promise<boolean> => {
    let attempt = 0;
    const baseDelay = 3000; // Increased base delay for mobile
    
    while (attempt < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from('user_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          console.log('Plan update confirmed:', data);
          return true;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(1.5, attempt);
        console.log(`Attempt ${attempt + 1}/${maxAttempts}: Waiting ${delay}ms before next check`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } catch (error) {
        console.error('Error polling for plan update:', error);
        attempt++;
      }
    }
    return false;
  };

  useEffect(() => {
    loadRazorpayScript().catch(error => {
      console.error('Error loading Razorpay:', error);
      toast({
        title: "Payment system error",
        description: "Failed to initialize payment system. Please refresh the page.",
        variant: "destructive",
      });
    });

    return () => {
      const script = document.getElementById('razorpay-script');
      if (script) {
        script.remove();
      }
    };
  }, [loadRazorpayScript, toast]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // First verify we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsSigningOut(false);
        await supabase.auth.signOut();
        toast({
          title: "Already signed out",
          description: "You have been redirected to the home page",
        });
        return;
      }

      // Proceed with sign out if we have a session
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSelectPlan = async (planType: 'hourly' | 'daily' | 'monthly') => {
    try {
      setShowUpgradeDialog(false);

      const session = await verifySession();
      if (!session?.user?.id) {
        throw new Error('Session verification failed. Please sign in again.');
      }
      const user = session.user;

      if (!isRazorpayLoaded) {
        await loadRazorpayScript();
      }

      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Payment system failed to initialize. Please refresh the page.');
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error || !data?.orderId) {
        throw new Error('Could not create payment order. Please try again.');
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Serona AI",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        order_id: data.orderId,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#1EAEDB",
          backdrop_color: "rgba(0,0,0,0.8)"
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 900,
        modal: {
          confirm_close: true,
          ondismiss: async function() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              // Only reset if we still have a valid session
              setShowUpgradeDialog(false);
            }
          },
          escape: false,
          animation: true,
          handleback: true,
        },
        handler: async function (response: any) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Invalid payment response received');
            }

            await verifyPayment({
              userId: user.id,
              planType,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });

            if (showProfileDialog) {
              setShowProfileDialog(false);
              setTimeout(() => setShowProfileDialog(true), 100);
            }

          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Error activating plan",
              description: error.message || "Please try refreshing the page",
              variant: "destructive",
              duration: 10000,
            });
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on('payment.error', function(resp: any) {
        console.error('Payment error:', resp);
        toast({
          title: "Payment failed",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive",
        });
      });

      razorpay.open();

    } catch (error: any) {
      console.error('Payment setup error:', error);
      toast({
        title: "Error setting up payment",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-[#1EAEDB]">
            <span className="h-9 w-9 rounded-full flex items-center justify-center text-white font-medium">
              {userEmail?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white border rounded-md shadow-md">
          <DropdownMenuItem
            onClick={() => setShowProfileDialog(true)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowUpgradeDialog(true)}
            className="text-[#1EAEDB] cursor-pointer"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade Plan
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isVerifying} // Don't allow sign out during payment verification
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut && !isVerifying ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpgradePlansDialog 
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onSelectPlan={handleSelectPlan}
      />

      {userEmail && (
        <UserProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          userEmail={userEmail}
        />
      )}
    </>
  );
}
