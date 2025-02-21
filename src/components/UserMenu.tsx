
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
import { UpgradePlansDialog } from "@/components/ui/upgrade-plans-dialog";
import { UserProfileDialog } from "@/components/ui/user-profile-dialog";
import { UserMenuTrigger } from "@/components/ui/user-menu-trigger";
import { loadRazorpayScript } from "@/utils/razorpayLoader";
import { usePayment } from "@/hooks/usePayment";

interface UserMenuProps {
  userEmail: string | undefined;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const { toast } = useToast();
  const { isLoading, handlePayment } = usePayment(userEmail);

  useEffect(() => {
    loadRazorpayScript()
      .then(() => setIsRazorpayLoaded(true))
      .catch(error => {
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
  }, [toast]);

  const handleSignOut = async () => {
    try {
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
    }
  };

  const handleSelectPlan = async (planType: 'hourly' | 'daily' | 'monthly') => {
    setShowUpgradeDialog(false);

    if (!isRazorpayLoaded) {
      try {
        await loadRazorpayScript();
        setIsRazorpayLoaded(true);
      } catch (error) {
        toast({
          title: "Payment system not ready",
          description: "Please refresh the page and try again",
          variant: "destructive",
        });
        return;
      }
    }

    await handlePayment(planType);
    
    // Refresh profile dialog if open
    if (showProfileDialog) {
      setShowProfileDialog(false);
      setTimeout(() => setShowProfileDialog(true), 1000);
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
