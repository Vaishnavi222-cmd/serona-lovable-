
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

const Hero = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scriptLoadedRef = useRef(false);
  const isMobile = useIsMobile();

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

    if (isMobile && iframeRef.current && !scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const iframeContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              .ad-container { position: relative; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <div class="ad-container">
              <script>
                (function(bgcf){
                  var d = document,
                      s = d.createElement('script'),
                      l = d.scripts[d.scripts.length - 1];
                  s.settings = bgcf || {};
                  s.id = "ad-script-1";
                  s.src = "//villainous-appointment.com/bGXSVVsbd.GElW0DYEWSdyiVYZWp5VuIZ/XrIw/ZelmN9Su_ZlU-l-kdPOTEYIxjN/DdAByuMuDkUhtWN/jbEd0xMqDmIGw/NUgL?" + ${timestamp};
                  s.async = true;
                  s.referrerPolicy = 'no-referrer-when-downgrade';
                  s.setAttribute('crossorigin', 'anonymous');
                  if (!document.getElementById("ad-script-1")) {
                    l.parentNode.insertBefore(s, l);
                  }
                })({})
              </script>
            </div>
          </body>
        </html>
      `;
      
      iframeRef.current.srcdoc = iframeContent;
    }

    return () => {
      observer.disconnect();
      if (iframeRef.current) {
        iframeRef.current.srcdoc = '';
        scriptLoadedRef.current = false;
      }
    };
  }, [isMobile]);

  return (
    <section className="min-h-[85vh] md:min-h-[70vh] flex items-center justify-center relative overflow-hidden bg-serona-dark px-4 md:px-6 py-4 md:py-16">
      <div className="absolute inset-0 bg-[url('/photo-1485827404703-89b55fcc595e')] bg-cover bg-center opacity-10" 
           role="img" 
           aria-label="AI chat online for self improvement and life choices" 
      />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center" ref={contentRef}>
          <div className="mb-4 md:mb-10 pt-2">
            <Brain 
              className="w-14 h-14 md:w-20 md:h-20 mx-auto text-serona-primary animate-pulse" 
              aria-label="AI chatbot online for making decisions and self development" 
            />
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
          
          {/* Ad Container - Mobile Only */}
          {isMobile && (
            <iframe 
              ref={iframeRef}
              className="mx-auto my-4 block"
              style={{ 
                width: '300px',
                height: '100px',
                border: 'none',
                background: 'transparent',
                overflow: 'hidden'
              }}
              sandbox="allow-scripts"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
