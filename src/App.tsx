
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Disclaimer from "./pages/Disclaimer";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";

// Force disable all background operations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      enabled: false, // Completely disable all queries
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

const App = () => {
  // Force stop any scrolling
  useEffect(() => {
    const stopScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    };
    
    // Clean up any existing scroll listeners
    const events = ['scroll', 'touchmove', 'wheel'];
    events.forEach(event => {
      window.removeEventListener(event, stopScroll, { passive: false });
      window.addEventListener(event, stopScroll, { passive: false });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, stopScroll);
      });
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
            {/* Force redirect /chat to home */}
            <Route path="/chat" element={<Navigate to="/" replace />} />
            <Route path="/recommendations" element={<NotFound />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
