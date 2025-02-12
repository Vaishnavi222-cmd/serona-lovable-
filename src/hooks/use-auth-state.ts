
import { useState } from 'react';

export const useAuthState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  const handleAuthError = (error: any) => {
    stopLoading();
    let message = 'An error occurred during authentication';
    
    // Map common error messages to user-friendly versions
    if (error?.message?.toLowerCase().includes('email already exists')) {
      message = 'This email is already registered. Please sign in instead.';
    } else if (error?.message?.toLowerCase().includes('invalid login credentials')) {
      message = 'Invalid email or password. Please try again.';
    } else if (error?.message?.toLowerCase().includes('password')) {
      message = 'Password must be at least 6 characters long and contain both letters and numbers.';
    } else if (error?.message?.toLowerCase().includes('network')) {
      message = 'Network error. Please check your internet connection and try again.';
    }
    
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000); // Clear error after 5 seconds
  };

  const handleAuthSuccess = (message: string) => {
    stopLoading();
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000); // Clear success after 3 seconds
  };

  return {
    isLoading,
    errorMessage,
    successMessage,
    startLoading,
    stopLoading,
    handleAuthError,
    handleAuthSuccess,
  };
};
