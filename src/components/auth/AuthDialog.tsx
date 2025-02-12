
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthState } from '@/hooks/use-auth-state';
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from './AuthForm';
import { GoogleSignIn } from './GoogleSignIn';
import { AuthMessages } from './AuthMessages';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const { errorMessage, successMessage, handleAuthError } = useAuthState();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onClose();
      }
    };
    
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'signin' 
                ? 'Sign in to continue the conversation' 
                : 'Sign up to start chatting'}
            </p>
          </div>

          <AuthMessages 
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          <GoogleSignIn onError={handleAuthError} />

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <AuthForm 
            mode={mode}
            onModeChange={setMode}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
