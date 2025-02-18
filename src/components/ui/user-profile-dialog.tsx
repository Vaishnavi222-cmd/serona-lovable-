
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Mail, Key, History, Crown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function UserProfileDialog({ open, onOpenChange, userEmail }: UserProfileDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [activePlan, setActivePlan] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  // Fetch user's active plan and purchase history when dialog opens
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch active plan
      const { data: planData, error: planError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        console.error('Error fetching active plan:', planError);
      } else {
        setActivePlan(planData);
      }

      // Fetch purchase history
      const { data: historyData, error: historyError } = await supabase
        .from('user_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error fetching purchase history:', historyError);
      } else {
        setPurchaseHistory(historyData || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="plan" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plan">Current Plan</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-[#1EAEDB]" />
                <h3 className="text-lg font-semibold">Active Plan</h3>
              </div>
              {activePlan ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    {activePlan.plan_type.charAt(0).toUpperCase() + activePlan.plan_type.slice(1)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Remaining Tokens:</span>{' '}
                    {activePlan.remaining_output_tokens.toLocaleString()} output / {activePlan.remaining_input_tokens.toLocaleString()} input
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Expires:</span>{' '}
                    {new Date(activePlan.end_time).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active plan</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-[#1EAEDB]" />
                <h3 className="text-lg font-semibold">Purchase History</h3>
              </div>
              {purchaseHistory.length > 0 ? (
                <div className="space-y-3">
                  {purchaseHistory.map((purchase) => (
                    <div key={purchase.id} className="p-3 border rounded-lg">
                      <p className="text-sm font-medium">
                        {purchase.plan_type.charAt(0).toUpperCase() + purchase.plan_type.slice(1)} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        Purchased on {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Amount: ₹{(purchase.amount_paid / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No purchase history</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  <p className="text-sm font-medium">Email Address</p>
                </div>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4" />
                  <p className="text-sm font-medium">Password</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleResetPassword}
                  disabled={isLoading}
                >
                  Reset Password
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
