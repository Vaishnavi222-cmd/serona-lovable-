import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-serona-dark/90 backdrop-blur-lg shadow-lg' : ''
    }`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/d085d564-8a24-4e71-b13a-ebd553eca1ca.png"
              alt="Serona AI Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <button className="px-6 py-2 bg-serona-primary text-serona-dark rounded-full hover:bg-serona-accent transition-colors duration-300">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="text-serona-secondary hover:text-serona-primary transition-colors duration-300 font-medium"
  >
    {children}
  </Link>
);

export default Navbar;