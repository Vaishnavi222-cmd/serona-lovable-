
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

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();

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

  // Poll for plan update
  const pollForPlanUpdate = async (userId: string, maxAttempts = 10): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking plan:', error);
        continue;
      }

      if (data) {
        console.log('Plan update confirmed:', data);
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planType: 'hourly' | 'daily' | 'monthly') => {
    setShowUpgradeDialog(false);

    try {
      setIsLoading(true);

      // Verify session is active
      const session = await verifySession();
      if (!session?.user?.id) {
        throw new Error('Session verification failed. Please sign in again.');
      }
      const user = session.user;

      console.log('Creating payment for user:', user.id);

      // Ensure Razorpay is loaded
      if (!isRazorpayLoaded) {
        console.log('Loading Razorpay script...');
        await loadRazorpayScript();
      }

      // Verify Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Payment system failed to initialize. Please refresh the page.');
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error || !data?.orderId) {
        console.error('Create payment error:', error);
        throw new Error('Could not create payment order. Please try again.');
      }

      console.log('Payment order created:', data);

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
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
          escape: true,
        },
        handler: async function (response: any) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Invalid payment response received');
            }

            console.log('Payment successful, verifying...', response);
            
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planType,
                userId: user.id
              }
            });

            if (verifyResponse.error || !verifyResponse.data) {
              console.error('Verification error:', verifyResponse.error);
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }

            console.log('Verification successful:', verifyResponse);

            // Poll for plan update with increased timeout and delay
            const planUpdated = await pollForPlanUpdate(user.id, 15, 2000); // 15 attempts, 2 second delay
            
            if (!planUpdated) {
              console.error('Plan update verification failed');
              toast({
                title: "Payment processed",
                description: "Your payment was successful but plan activation is taking longer than expected. Please refresh the page in a few moments.",
                duration: 10000,
              });
            } else {
              toast({
                title: "Payment successful",
                description: `Your ${planType} plan is now active`,
              });
              
              // Refresh the profile dialog data if it's open
              if (showProfileDialog) {
                // This will trigger a re-fetch in UserProfileDialog
                setShowProfileDialog(false);
                setTimeout(() => setShowProfileDialog(true), 100);
              }
            }

          } catch (error: any) {
            console.error('Verification error:', error);
            toast({
              title: "Error activating plan",
              description: error.message || "An unexpected error occurred",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment setup error:', error);
      setIsLoading(false);
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
        <DropdownMenuContent align="end" className="w-56">
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
            disabled={isLoading}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? "Signing out..." : "Sign out"}
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
