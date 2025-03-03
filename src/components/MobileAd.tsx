
import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const MobileAd = () => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) return;

    const container = document.getElementById('mobile-ad-container');
    if (!container) return;

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
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <div className="w-full bg-serona-dark/80 p-4 rounded-lg mb-8">
      <div id="mobile-ad-container" className="w-full h-[600px]" />
    </div>
  );
};

export default MobileAd;
