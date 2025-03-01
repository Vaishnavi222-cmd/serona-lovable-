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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // If already loaded, resolve immediately
      if (typeof (window as any).Razorpay !== 'undefined') {
        console.log('Razorpay already loaded');
        setRazorpayLoaded(true);
        resolve();
        return;
      }

      console.log('Loading Razorpay script...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setRazorpayLoaded(true);
        resolve();
      };

      script.onerror = () => {
        const error = new Error('Failed to load Razorpay script');
        console.error(error);
        setRazorpayLoaded(false);
        reject(error);
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

  // Load Razorpay script when component mounts
  useEffect(() => {
    loadRazorpayScript().catch(error => {
      console.error('Error loading Razorpay:', error);
      toast({
        title: "Payment system error",
        description: "Failed to initialize payment system. Please refresh the page.",
        variant: "destructive",
      });
    });
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
    console.log('Handle select plan started for:', planType);
    
    if (isLoading) {
      console.log('Already processing a request, aborting');
      return;
    }

    try {
      setIsLoading(true);
      
      // Ensure Razorpay is loaded
      if (!razorpayLoaded) {
        console.log('Razorpay not loaded, attempting to load...');
        await loadRazorpayScript();
      }

      if (!(window as any).Razorpay) {
        throw new Error('Razorpay failed to initialize');
      }

      // Create payment order
      console.log('Creating payment order...');
      const response = await supabase.functions.invoke('create-payment', {
        body: { planType }
      });

      console.log('Payment order response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create payment order');
      }

      const { data } = response;
      
      if (!data?.orderId || !data?.keyId) {
        console.error('Invalid payment response:', data);
        throw new Error('Invalid payment response received');
      }

      console.log('Initializing Razorpay payment...');
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
        handler: async function(response: any) {
          console.log('Payment successful, received response:', response);
          try {
            const session = await verifySession();
            
            const verifyResponse = await supabase.functions.invoke('verify-payment', {
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planType,
                userId: session.user.id
              }
            });

            if (verifyResponse.error) {
              throw verifyResponse.error;
            }

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });
            
            setShowUpgradeDialog(false);
            
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Error processing payment",
              description: error.message || "Please contact support if the issue persists",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Razorpay modal dismissed');
            setIsLoading(false);
          }
        }
      };

      console.log('Opening Razorpay modal with options:', { ...options, key: '[REDACTED]' });
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
