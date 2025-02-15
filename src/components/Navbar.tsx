
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ShoppingCart, Menu as MenuIcon, X, LogOut } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-serona-dark/90 backdrop-blur-lg shadow-lg' : 'bg-serona-dark/80 backdrop-blur-md'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-serona-primary font-bold text-xl">Serona AI</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/chat">
              <MessageSquare className="w-4 h-4 inline-block mr-1" />
              Chat
            </NavLink>
            <NavLink to="/contact">
              <Mail className="w-4 h-4 inline-block mr-1" />
              Contact
            </NavLink>
            <NavLink to="/recommendations">
              <ShoppingCart className="w-4 h-4 inline-block mr-1" />
              Recommendations
            </NavLink>
            {!isAuthenticated ? (
              <button className="px-6 py-2 bg-serona-primary text-serona-dark rounded-full hover:bg-serona-accent transition-colors duration-300">
                Get Started
              </button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-serona-secondary hover:text-serona-primary transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            )}
          </div>

          <button 
            className="md:hidden text-serona-secondary hover:text-serona-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'transparent' }}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-serona-dark py-4 animate-fade-up">
            <div className="flex flex-col space-y-4 px-4">
              <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
              <NavLink to="/chat" onClick={() => setIsMobileMenuOpen(false)}>
                <MessageSquare className="w-4 h-4 inline-block mr-1" />
                Chat
              </NavLink>
              <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Mail className="w-4 h-4 inline-block mr-1" />
                Contact
              </NavLink>
              <NavLink to="/recommendations" onClick={() => setIsMobileMenuOpen(false)}>
                <ShoppingCart className="w-4 h-4 inline-block mr-1" />
                Recommendations
              </NavLink>
              {!isAuthenticated ? (
                <button className="px-6 py-2 bg-serona-primary text-serona-dark rounded-full hover:bg-serona-accent transition-colors duration-300 w-full">
                  Get Started
                </button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-serona-secondary hover:text-serona-primary transition-colors flex items-center gap-2 justify-center w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => (
  <Link
    to={to}
    className="text-serona-secondary hover:text-serona-primary transition-colors duration-300 font-medium flex items-center"
    onClick={onClick}
  >
    {children}
  </Link>
);

export default Navbar;
