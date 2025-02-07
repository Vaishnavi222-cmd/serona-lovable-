
import { MessageSquare, Mail, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-serona-dark/95 backdrop-blur-md text-serona-secondary">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img
              src="/lovable-uploads/d085d564-8a24-4e71-b13a-ebd553eca1ca.png"
              alt="Serona AI Logo"
              className="h-10 w-auto"
            />
            <p className="text-serona-secondary/70">
              Empowering the future with artificial intelligence solutions.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Chat
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><span className="text-serona-secondary/70">Personality Insights</span></li>
              <li><span className="text-serona-secondary/70">Career Guidance</span></li>
              <li><span className="text-serona-secondary/70">Relationship Advice</span></li>
              <li><span className="text-serona-secondary/70">Self Improvement Help</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/disclaimer" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-serona-secondary/20">
          <p className="text-center text-serona-secondary/70 text-sm">
            © {new Date().getFullYear()} Serona AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
