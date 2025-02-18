
import { useState } from 'react';
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
import { UpgradePlansDialog } from "@/components/ui/upgrade-plans-dialog";
import { UserProfileDialog } from "@/components/ui/user-profile-dialog";
import { UserMenuTrigger } from "./UserMenuTrigger";
import { useRazorpay } from "@/providers/RazorpayProvider";
import { createPaymentOrder, verifyPayment } from "@/services/payment-service";

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const { toast } = useToast();
  const { razorpayLoaded, initializePayment } = useRazorpay();

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
    if (!razorpayLoaded) {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await createPaymentOrder(planType);
      console.log('Payment order created:', data.orderId);

      // Close upgrade dialog before opening Razorpay
      setShowUpgradeDialog(false);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Lovable AI",
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        order_id: data.orderId,
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          try {
            await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planType,
            });

            toast({
              title: "Payment successful",
              description: `Your ${planType} plan is now active`,
            });
            
            // Refresh the profile dialog to show the new plan
            if (showProfileDialog) {
              setShowProfileDialog(false);
              setTimeout(() => setShowProfileDialog(true), 1000);
            }
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
            console.log('Payment modal dismissed');
            setIsLoading(false);
          },
          escape: false,
          backdropClose: false,
          handleback: false,
        },
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#1EAEDB",
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: "Pay using Credit/Debit Card",
                instruments: [{ method: "card" }]
              },
              other: {
                name: "Other Payment Methods",
                instruments: [{ method: "upi" }]
              }
            },
            sequence: ["block.utib", "block.other"],
            preferences: {
              show_default_blocks: true
            }
          }
        }
      };

      setTimeout(() => {
        initializePayment(options);
        console.log('Razorpay modal opened');
      }, 100);

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
          <UserMenuTrigger userEmail={userEmail} />
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
