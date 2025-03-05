
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const MobileAd = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    const cleanup = () => {
      const adScripts = document.querySelectorAll('script[src*="villainous-appointment.com"]');
      adScripts.forEach(script => {
        script.remove();
        // Remove any event listeners that might have been attached to window/document
        window.removeEventListener('click', script as any);
        document.removeEventListener('click', script as any);
      });
    };

    if (isMobile && !scriptLoadedRef.current && adContainerRef.current) {
      // Clean up any existing ad scripts first
      cleanup();
      
      scriptLoadedRef.current = true;
      const adDiv = document.createElement('div');
      adDiv.style.position = 'relative';
      adDiv.style.zIndex = '1';
      adDiv.style.pointerEvents = 'all';
      // Create a shadow root to isolate the ad content
      const shadow = adDiv.attachShadow({ mode: 'closed' });
      
      const script = document.createElement('script');
      script.innerHTML = `
        (function(qjbmx){
          var d = document,
              s = d.createElement('script'),
              l = d.scripts[d.scripts.length - 1];
          s.settings = qjbmx || {};
          s.id = "ad-script-2";
          s.src = "//villainous-appointment.com/b.XSVZs/dJGmld0gYSWcd/i-YaWs5/uDZRXeIh/oeSmr9eulZ/U/lOk/P/TtYGx/NwDNMlzVMMDfYat-NBjdEZ0QMmzNMxwLNAwu";
          s.async = true;
          s.referrerPolicy = 'no-referrer-when-downgrade';
          if (!document.getElementById("ad-script-2")) {
            l.parentNode.insertBefore(s, l);
          }
        })({})
      `;
      shadow.appendChild(script);
      adContainerRef.current.appendChild(adDiv);
    }

    return () => {
      if (adContainerRef.current) {
        cleanup();
        adContainerRef.current.innerHTML = '';
        scriptLoadedRef.current = false;
      }
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <div 
      ref={adContainerRef}
      className="mx-auto my-4 flex justify-center items-center"
      style={{ 
        maxWidth: '100%',
        minHeight: '100px',
        background: 'transparent',
        isolation: 'isolate',
        pointerEvents: 'none',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
};

export default MobileAd;
