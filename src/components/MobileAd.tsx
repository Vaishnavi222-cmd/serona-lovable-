
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileAd = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only proceed if we're on mobile
    if (!isMobile) return;

    // Create ad container first
    let container = document.getElementById('mobile-ad-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'mobile-ad-container';
      container.style.minHeight = '300px';
      container.style.width = '100%';
      document.body.appendChild(container);
    }

    // Then create and append the script
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

    return () => {
      document.body.removeChild(script);
      container?.remove();
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div id="mobile-ad-container" className="w-full h-[300px]" />
    </div>
  );
};

export default MobileAd;
