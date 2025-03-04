
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const MobileAd = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    if (isMobile && !scriptLoadedRef.current && adContainerRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.innerHTML = `
        (function(qjbmx){
          var d = document,
              s = d.createElement('script'),
              l = d.scripts[d.scripts.length - 1];
          s.settings = qjbmx || {};
          s.src = "//villainous-appointment.com/b.XSVZs/dJGmld0gYSWcd/i-YaWs5/uDZRXeIh/oeSmr9eulZ/U/lOk/P/TtYGx/NwDNMlzVMMDfYat-NBjdEZ0QMmzNMxwLNAwu";
          s.async = false;
          s.referrerPolicy = 'no-referrer-when-downgrade';
          l.parentNode.insertBefore(s, l);
        })({})
      `;
      adContainerRef.current.appendChild(script);
    }
    
    return () => {
      if (adContainerRef.current) {
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
        background: 'transparent'
      }}
    />
  );
};

export default MobileAd;
