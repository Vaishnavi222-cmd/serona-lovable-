import { useEffect, useRef } from 'react';

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
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="text-center" ref={contentRef}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Welcome
          </h1>
          
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up" style={{ animationDelay: '0.6s' }}>
            Start building your new website
          </p>
          
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: '0.9s' }}>
            <a
              href="#features"
              className="inline-block px-8 py-4 bg-black text-white rounded-full
                        font-medium transition-all duration-300 hover:bg-gray-800 hover:scale-105"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;