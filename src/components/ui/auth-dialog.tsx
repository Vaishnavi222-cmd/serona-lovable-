
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.email) errors.push("Email is required");
    if (!formData.email.includes('@')) errors.push("Invalid email format");
    if (!formData.password) errors.push("Password is required");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters");
    if (isSignUp && !formData.fullName) errors.push("Full name is required");
    
    return errors;
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join('\n'),
        variant: "destructive",
        className: "fixed top-4 right-4 z-[2000] max-w-[350px]"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting sign in with:', formData.email);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      onOpenChange(false);
      toast({
        title: "Success",
        description: "You have been signed in successfully",
        className: "fixed top-4 right-4 z-[2000] max-w-[350px]"
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
        className: "fixed top-4 right-4 z-[2000] max-w-[350px]"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join('\n'),
        variant: "destructive",
        className: "fixed top-4 right-4 z-[2000] max-w-[350px]"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting sign up with:', formData.email);
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      // Automatically sign in after successful signup
      await handleEmailSignIn(e);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
        className: "fixed top-4 right-4 z-[2000] max-w-[350px]"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="bg-white opacity-100 max-w-[425px] w-full max-h-[90vh] rounded-lg p-6 shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center text-gray-900">
            Welcome to Serona AI
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4 bg-white">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#40E0D0] focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#40E0D0] focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onClick={isSignUp ? handleEmailSignUp : handleEmailSignIn}
            className="w-full h-10 bg-[#40E0D0] text-white rounded-md hover:bg-[#40E0D0]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#40E0D0] disabled:opacity-50"
          >
            {loading ? "Please wait..." : (isSignUp ? "Sign up" : "Sign in")}
          </button>

          <p className="text-sm text-center text-gray-600">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#40E0D0] hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
