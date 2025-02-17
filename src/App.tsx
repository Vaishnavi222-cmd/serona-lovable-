
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
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Handle scroll events with correct TypeScript types
    document.addEventListener('scroll', preventDefault, { capture: true, passive: false });
    document.addEventListener('touchmove', preventDefault, { capture: true, passive: false });
    document.addEventListener('wheel', preventDefault, { capture: true, passive: false });
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
    }, { capture: true });

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.removeEventListener('scroll', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('wheel', preventDefault);
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
