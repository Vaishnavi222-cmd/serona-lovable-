import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-white/10 backdrop-blur-lg border-t border-white/20">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-sirona-dark">Sirona AI</h3>
            <p className="text-sirona-dark/70">
              Empowering the future with artificial intelligence solutions.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-sirona-dark mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Home</a></li>
              <li><a href="/about" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">About</a></li>
              <li><a href="/services" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Services</a></li>
              <li><a href="/contact" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-sirona-dark mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="/services#ai-solutions" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">AI Solutions</a></li>
              <li><a href="/services#consulting" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Consulting</a></li>
              <li><a href="/services#integration" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Integration</a></li>
              <li><a href="/services#support" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-sirona-dark mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-sirona-dark/70 hover:text-sirona-purple transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/20">
          <p className="text-center text-sirona-dark/70">
            © {new Date().getFullYear()} Sirona AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;