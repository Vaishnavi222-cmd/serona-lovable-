import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  email: string;
  password: string;
  fullName?: string;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({ email: "", password: "", fullName: "" });
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
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
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
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting sign up with:', formData.email);
      
      // Add site URL to ensure confirmation emails work
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your email (including spam folder) to confirm your account. The confirmation email should arrive within a few minutes.",
      });
      
      // Close the dialog after successful signup
      onOpenChange(false);
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log('Attempting Google sign in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while signing in with Google",
        variant: "destructive",
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
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-10 flex items-center justify-center gap-2 px-4 bg-white border border-[#dadce0] rounded-md hover:bg-gray-50 transition-colors text-[#3c4043] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#40E0D0] focus:border-transparent"
                  disabled={loading}
                />
              </div>
            )}

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
              className="w-full h-10 bg-[#40E0D0] text-white rounded-md hover:bg-[#40E0D0]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#40E0D0] disabled:opacity-50"
            >
              {loading ? "Please wait..." : (isSignUp ? "Sign up" : "Sign in")}
            </button>
          </form>

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
