
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from '@/hooks/use-auth-state';

interface GoogleSignInProps {
  onError: (error: any) => void;
}

export function GoogleSignIn({ onError }: GoogleSignInProps) {
  const { isLoading, startLoading } = useAuthState();

  const handleGoogleSignIn = async () => {
    startLoading();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) {
      onError(error);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outline"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 mb-6"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-4 h-4"
      />
      {isLoading ? 'Connecting...' : 'Continue with Google'}
    </Button>
  );
}
