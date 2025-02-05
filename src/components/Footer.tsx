import { Github, Twitter, Linkedin, MessageSquare, Mail, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-serona-dark text-serona-secondary">
      <div className="container mx-auto px-6 py-12">
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
                <Link to="/" className="text-serona-secondary/70 hover:text-serona-primary transition-colors flex items-center gap-2">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-serona-secondary/70 hover:text-serona-primary transition-colors flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-serona-secondary/70 hover:text-serona-primary transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="text-serona-secondary/70 hover:text-serona-primary transition-colors flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#ai-solutions" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">AI Solutions</a></li>
              <li><a href="#machine-learning" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">Machine Learning</a></li>
              <li><a href="#automation" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">Automation</a></li>
              <li><a href="#consulting" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">Consulting</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-serona-secondary/70 hover:text-serona-primary transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-serona-secondary/20">
          <p className="text-center text-serona-secondary/70">
            © {new Date().getFullYear()} Serona AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;