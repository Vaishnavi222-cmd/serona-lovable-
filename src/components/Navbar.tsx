
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/ui/login-dialog";
import { UserMenu } from "@/components/UserMenu";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold">
            Serona
          </Link>
          <Link to="/chat" className="text-sm font-medium text-muted-foreground">
            Chat
          </Link>
          <Link to="/recommendations" className="text-sm font-medium text-muted-foreground">
            Recommendations
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {userEmail ? (
            <UserMenu userEmail={userEmail} />
          ) : (
            <Button variant="outline" onClick={() => setShowLoginDialog(true)}>
              Sign In
            </Button>
          )}
        </div>
      </div>
      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </nav>
  );
}
