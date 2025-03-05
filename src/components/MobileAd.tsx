
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const MobileAd = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    if (isMobile && !scriptLoadedRef.current && adContainerRef.current) {
      scriptLoadedRef.current = true;
      
      // Create a shadow root for isolation
      const shadowRoot = adContainerRef.current.attachShadow({ mode: 'closed' });
      
      // Create container div inside shadow root
      const adContainer = document.createElement('div');
      adContainer.style.width = '100%';
      adContainer.style.height = '100%';
      adContainer.style.position = 'relative';
      adContainer.style.zIndex = '1';
      
      // Create and append script
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
      
      adContainer.appendChild(script);
      shadowRoot.appendChild(adContainer);

      // Event isolation
      const stopPropagation = (e: Event) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      adContainer.addEventListener('click', stopPropagation, true);
      adContainer.addEventListener('mousedown', stopPropagation, true);
      adContainer.addEventListener('mouseup', stopPropagation, true);
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
      className="mx-auto my-4 flex justify-center items-center relative"
      style={{ 
        maxWidth: '100%',
        minHeight: '100px',
        background: 'transparent',
        isolation: 'isolate',
        pointerEvents: 'none' // Make container non-interactive by default
      }}
    >
      <div style={{ 
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto' // Enable interactions only for the ad content
      }} />
    </div>
  );
};

export default MobileAd;
