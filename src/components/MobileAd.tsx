
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileAd = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    const script = document.createElement('script');
    script.innerHTML = `
      (function(zvl){
        var d = document,
            s = d.createElement('script'),
            l = d.scripts[d.scripts.length - 1];
        s.settings = zvl || {};
        s.src = "//villainous-appointment.com/b.XwV/sbd/GrlJ0BYeW/d/iDYIW/5-uTZGXAIK/Ne/mW9fuNZbUAlYkxP/TlYnxENkDpAZ0LNsjaAbtLN/jeEI0sMqDzQF2/M-Qj";
        s.async = true;
        s.referrerPolicy = 'no-referrer-when-downgrade';
        l.parentNode.insertBefore(s, l);
      })({})
    `;

    document.body.appendChild(script);

    // Create a container div if it doesn't exist
    let container = document.getElementById('mobile-ad-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mobile-ad-container';
      document.body.appendChild(container);
    }

    return () => {
      document.body.removeChild(script);
      container?.remove();
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <div className="my-4 mx-auto w-full max-w-[300px] min-h-[100px] flex items-center justify-center bg-serona-light/50 rounded">
      <div id="mobile-ad-container" className="w-full h-full" />
    </div>
  );
};

export default MobileAd;
