
import { useState, useEffect } from 'react';
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
  const { toast } = useToast();

  // Load Razorpay script on component mount with error handling
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        // Remove any existing Razorpay script
        const existingScript = document.getElementById('razorpay-script');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;

        // Add error handling for script load failure
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          toast({
            title: "Payment system error",
            description: "Failed to initialize payment system. Please refresh the page.",
            variant: "destructive",
          });
        };

        // Add load event handler
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
        };

        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading Razorpay:', error);
      }
    };
    loadRazorpay();
  }, [toast]);

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
    // Close upgrade dialog first
    setShowUpgradeDialog(false);

    // Check if Razorpay is properly loaded
    if (typeof (window as any).Razorpay === 'undefined') {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      // Create payment order
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error) throw error;
      if (!data || !data.orderId) {
        throw new Error('Could not create payment order. Please try again.');
      }

      // Configure Razorpay options
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
          // Enable this to support mobile browser
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
          confirm_close: true, // Ask for confirmation when closing the modal
          escape: true, // Allow escape key to close the modal
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        handler: async function (response: any) {
          try {
            console.log('Payment success, verifying...', response);
            const { error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planType,
              },
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });
            
            // Refresh profile dialog if open
            if (showProfileDialog) {
              setShowProfileDialog(false);
              setTimeout(() => setShowProfileDialog(true), 1000);
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: "Your payment was received but verification failed. Our team will verify manually.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        },
      };

      console.log('Creating Razorpay instance with options:', { ...options, key: '[REDACTED]' });
      const razorpay = new (window as any).Razorpay(options);

      // Add specific error handlers
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setIsLoading(false);
        toast({
          title: "Payment failed",
          description: response.error.description || "Please try again or use a different payment method",
          variant: "destructive",
        });
      });

      razorpay.on('payment.error', function (response: any) {
        console.error('Payment error:', response);
        setIsLoading(false);
        toast({
          title: "Payment error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      });

      // Open Razorpay modal
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
