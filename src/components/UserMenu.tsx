
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
import { useRazorpayLoader } from "@/hooks/use-razorpay-loader";

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const { toast } = useToast();
  const { verifyPayment, isVerifying } = usePaymentVerification();
  const { isRazorpayLoaded, loadRazorpayScript } = useRazorpayLoader();

  // Enhanced session verification with retry
  const verifySession = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session) {
          return session;
        }
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Session verification attempt failed:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    throw new Error('No active session found after retries.');
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Verify session with retries
      try {
        await verifySession();
      } catch (error) {
        // If session verification fails, we're already signed out
        setIsSigningOut(false);
        toast({
          title: "Already signed out",
          description: "You have been redirected to the home page",
        });
        return;
      }

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

  useEffect(() => {
    loadRazorpayScript().catch(error => {
      console.error('Error initializing payment system:', error);
    });
  }, [loadRazorpayScript]);

  const handleSelectPlan = async (planType: 'hourly' | 'daily' | 'monthly') => {
    try {
      setShowUpgradeDialog(false);

      const session = await verifySession();
      if (!session?.user?.id) {
        throw new Error('Session verification failed. Please sign in again.');
      }
      const user = session.user;

      if (!isRazorpayLoaded) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Payment system failed to initialize. Please refresh the page.');
        }
      }

      // Check if running on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let paymentData;

      if (isMobile) {
        // Use direct HTTP request for mobile
        const response = await fetch('https://ptpxhzfjfssaxilyuwzd.supabase.co/functions/v1/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ planType }),
        });

        if (!response.ok) {
          throw new Error('Could not create payment order. Please try again.');
        }

        paymentData = await response.json();
      } else {
        // Use Supabase client for desktop
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: { planType },
        });

        if (error || !data?.orderId) {
          throw new Error('Could not create payment order. Please try again.');
        }
        paymentData = data;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Serona AI",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        order_id: paymentData.orderId,
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

            // Handle verification based on platform
            if (isMobile) {
              // Direct HTTP request for mobile
              const verifyResponse = await fetch('https://ptpxhzfjfssaxilyuwzd.supabase.co/functions/v1/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  userId: user.id,
                  planType,
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  isMobile: true
                }),
              });

              if (!verifyResponse.ok) {
                const error = await verifyResponse.json();
                throw new Error(error.message || 'Payment verification failed');
              }
            } else {
              // Supabase client for desktop
              await verifyPayment({
                userId: user.id,
                planType,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });
            }

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
