
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

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
    <section className="min-h-[85vh] md:min-h-[70vh] flex items-center justify-center relative overflow-hidden bg-serona-dark px-4 md:px-6 py-4 md:py-16">
      <div className="absolute inset-0 bg-[url('/photo-1485827404703-89b55fcc595e')] bg-cover bg-center opacity-10" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center" ref={contentRef}>
          <div className="mb-4 md:mb-10">
            <Brain className="w-14 h-14 md:w-20 md:h-20 mx-auto text-serona-primary animate-pulse" />
          </div>
          
          <h1 className="text-3xl md:text-7xl font-bold text-serona-secondary mb-4 md:mb-8 opacity-0 animate-fade-up flex flex-col space-y-1 md:space-y-2" style={{ animationDelay: '0.3s' }}>
            <span className="text-2xl md:text-6xl text-serona-secondary/90">Welcome to</span>
            <span className="text-3xl md:text-7xl">Serona AI !</span>
          </h1>
          
          <p className="text-base md:text-2xl text-serona-secondary/80 max-w-3xl mx-auto mb-6 md:mb-12 opacity-0 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            Your AI-Powered Guide for Self-Discovery & Growth. Serona AI analyzes your behavior and thinking patterns to provide personalized guidance, helping you navigate life's challenges with confidence.
          </p>
          
          <div className="opacity-0 animate-fade-up mb-4 md:mb-8" style={{ animationDelay: '0.9s' }}>
            <Link
              to="/chat"
              className="inline-block px-4 md:px-32 py-2 md:py-4 bg-serona-primary text-serona-dark rounded-full
                        font-medium transition-all duration-300 hover:bg-serona-accent hover:scale-105 
                        w-full md:w-auto text-sm md:text-lg min-w-0 md:min-w-[400px] mx-auto"
            >
              ➡️ Start Your Journey Today!
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
