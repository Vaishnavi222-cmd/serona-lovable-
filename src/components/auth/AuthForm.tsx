
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthState } from '@/hooks/use-auth-state';
import { supabase } from "@/integrations/supabase/client";

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  onClose: () => void;
}

export function AuthForm({ mode, onModeChange, onClose }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const {
    isLoading,
    startLoading,
    handleAuthError,
    handleAuthSuccess,
  } = useAuthState();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      handleAuthError({ message: 'Please enter a valid email address' });
      return;
    }
    
    startLoading();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleAuthError(error);
    } else {
      handleAuthSuccess('Successfully signed in!');
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      handleAuthError({ message: 'Please enter your full name' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      handleAuthError({ message: 'Please enter a valid email address' });
      return;
    }
    if (!(password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password))) {
      handleAuthError({ message: 'Password must be at least 6 characters long and contain both letters and numbers' });
      return;
    }
    
    startLoading();
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      handleAuthSuccess('Account created successfully! Please check your email for verification.');
      onModeChange('signin');
    } catch (error: any) {
      console.error('Signup error:', error);
      handleAuthError(error);
    }
  };

  return (
    <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
      {mode === 'signup' && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
            placeholder="Enter your full name"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
          placeholder="Enter your password"
        />
        {mode === 'signup' && (
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 6 characters long and contain both letters and numbers
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          mode === 'signin' ? 'Sign in' : 'Create account'
        )}
      </Button>
      
      <div className="text-sm text-center">
        {mode === 'signin' ? (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onModeChange('signup')}
              className="text-[#1EAEDB] hover:underline"
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onModeChange('signin')}
              className="text-[#1EAEDB] hover:underline"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </form>
  );
}
