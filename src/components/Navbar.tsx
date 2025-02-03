import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/10 backdrop-blur-lg shadow-lg' : ''
    }`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="#" className="text-sirona-dark font-bold text-xl">
            Sirona AI
          </a>
          
          {/* Mobile menu button */}
          <button 
            className="lg:hidden text-sirona-dark"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 bg-white/5 backdrop-blur-lg rounded-lg p-4">
            <div className="flex flex-col space-y-4">
              <NavLink href="#features" mobile>Features</NavLink>
              <NavLink href="#about" mobile>About</NavLink>
              <NavLink href="#contact" mobile>Contact</NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) => (
  <a
    href={href}
    className={`text-sirona-dark hover:text-sirona-purple transition-colors duration-300
      ${mobile ? 'block w-full py-2 px-4 hover:bg-white/10 rounded-lg' : ''}`}
  >
    {children}
  </a>
);

export default Navbar;