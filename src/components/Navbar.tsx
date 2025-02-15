
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { toast } = useToast();

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

  return (
    <nav className="flex items-center gap-4">
      <Link to="/" className="text-white hover:text-gray-300 transition-colors">
        Home
      </Link>
      <Link to="/chat" className="text-white hover:text-gray-300 transition-colors">
        Chat
      </Link>
      <Link to="/contact" className="text-white hover:text-gray-300 transition-colors">
        Contact
      </Link>
      <Button 
        variant="ghost" 
        onClick={handleSignOut}
        className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </nav>
  );
};

export default Navbar;
