
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const MobileAd = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    if (isMobile && !scriptLoadedRef.current && adContainerRef.current) {
      scriptLoadedRef.current = true;
      
      // Create shadow root for isolation
      const shadowRoot = adContainerRef.current.attachShadow({ mode: 'closed' });
      
      const adDiv = document.createElement('div');
      adDiv.style.position = 'relative';
      adDiv.style.zIndex = '1';
      
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
      adDiv.appendChild(script);
      shadowRoot.appendChild(adDiv);

      // Event isolation
      const stopPropagation = (e: Event) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      shadowRoot.addEventListener('click', stopPropagation, true);
      shadowRoot.addEventListener('mousedown', stopPropagation, true);
      shadowRoot.addEventListener('mouseup', stopPropagation, true);
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
        isolation: 'isolate'
      }}
    />
  );
};

export default MobileAd;
