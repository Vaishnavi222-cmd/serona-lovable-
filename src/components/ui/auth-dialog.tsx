
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Mail, LucideGoogle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while sending the magic link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while signing in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-semibold text-center">Welcome to Serona AI</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100">
            <TabsTrigger 
              value="social"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Social Login
            </TabsTrigger>
            <TabsTrigger 
              value="email"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Email Login
            </TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="p-6 pt-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Continue with your social account
              </p>
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 text-base border-2"
              >
                <LucideGoogle className="mr-2 h-5 w-5" />
                Sign in with Google
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="p-6 pt-4">
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-base bg-[#1EAEDB] hover:bg-[#1EAEDB]/90" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                We'll send you a magic link for a password-free sign in
              </p>
            </form>
          </TabsContent>
        </Tabs>

        <div className="p-6 pt-2">
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
