import { useEffect, useRef } from 'react';

const Hero = () => {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.1 }
    );

    if (logoRef.current) {
      observer.observe(logoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[#C992E0]" />
      
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center" ref={logoRef}>
          <div className="w-32 h-32 mx-auto mb-8 opacity-0 transform translate-y-4 transition-all duration-1000">
            <img
              src="/lovable-uploads/7437e344-eb2a-4e4e-99cb-7ea5d8c0045f.png"
              alt="Sirona AI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-sirona-dark mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Welcome to Sirona AI
          </h1>
          
          <p className="text-xl md:text-2xl text-sirona-dark/80 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            Experience the future of artificial intelligence with our cutting-edge solutions
          </p>
          
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: '0.9s' }}>
            <a
              href="#features"
              className="inline-block px-8 py-4 bg-white/10 backdrop-blur-lg text-sirona-dark rounded-full
                        font-medium transition-all duration-300 hover:bg-white/20 hover:scale-105
                        border border-white/20"
            >
              Discover More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;