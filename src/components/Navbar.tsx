
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, ShoppingCart, Menu as MenuIcon, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <button className="px-6 py-2 bg-serona-primary text-serona-dark rounded-full hover:bg-serona-accent transition-colors duration-300">
              Get Started
            </button>
          </div>

          <button 
            className="md:hidden text-serona-secondary hover:text-serona-primary transition-colors p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-serona-dark/95 backdrop-blur-lg py-4 animate-fade-up">
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
              <button className="px-6 py-2 bg-serona-primary text-serona-dark rounded-full hover:bg-serona-accent transition-colors duration-300 w-full">
                Get Started
              </button>
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
