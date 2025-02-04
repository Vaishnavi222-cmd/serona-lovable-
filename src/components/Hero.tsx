import { useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';

const Hero = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="min-h-[70vh] flex items-center justify-center relative overflow-hidden bg-serona-dark">
      <div className="absolute inset-0 bg-[url('/photo-1485827404703-89b55fcc595e')] bg-cover bg-center opacity-10" />
      
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center" ref={contentRef}>
          <div className="mb-8">
            <Cpu className="w-16 h-16 mx-auto text-serona-primary animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-serona-secondary mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Welcome to Serona AI
          </h1>
          
          <p className="text-xl md:text-2xl text-serona-secondary/80 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            Experience the future of artificial intelligence with our cutting-edge solutions
          </p>
          
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: '0.9s' }}>
            <a
              href="#features"
              className="inline-block px-16 py-4 bg-serona-primary text-serona-dark rounded-full
                        font-medium transition-all duration-300 hover:bg-serona-accent hover:scale-105 min-w-[250px]"
            >
              Explore AI Solutions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;