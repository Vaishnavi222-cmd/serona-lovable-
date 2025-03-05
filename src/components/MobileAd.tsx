
import { useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const MobileAd = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();
  const scriptLoadedRef = useRef(false);
  
  useEffect(() => {
    if (isMobile && !scriptLoadedRef.current && iframeRef.current) {
      scriptLoadedRef.current = true;
      
      const iframeContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              .ad-container { position: relative; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <div class="ad-container">
              <script>
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
              </script>
            </div>
          </body>
        </html>
      `;
      
      iframeRef.current.srcdoc = iframeContent;
    }
    
    return () => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = '';
        scriptLoadedRef.current = false;
      }
    };
  }, [isMobile]);

  if (!isMobile) return null;

  return (
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
  );
};

export default MobileAd;
