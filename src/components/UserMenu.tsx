
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

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();

  // Check if Razorpay is loaded
  useEffect(() => {
    if (!(window as any).Razorpay) {
      toast({
        title: "Warning",
        description: "Payment system is not loaded. Please refresh the page.",
        variant: "destructive",
      });
    }
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
    try {
      if (!(window as any).Razorpay) {
        toast({
          title: "Error",
          description: "Payment system is not loaded. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      // Create payment order
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planType },
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw error;
      }

      if (!data || !data.orderId) {
        throw new Error('Could not create payment order. Please try again.');
      }

      // Initialize Razorpay options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Lovable AI",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
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
            setShowUpgradeDialog(false);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification failed",
              description: error.message,
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast({
              title: "Payment cancelled",
              description: "You have cancelled the payment process",
            });
          }
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#1EAEDB",
        },
      };

      // Create and open Razorpay
      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        setIsLoading(false);
        toast({
          title: "Payment failed",
          description: response.error.description || "Payment could not be processed",
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Error creating payment",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <div className="flex items-center gap-2 p-2">
            <User className="h-4 w-4" />
            <p className="text-sm font-medium truncate">{userEmail}</p>
          </div>
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
    </>
  );
}
