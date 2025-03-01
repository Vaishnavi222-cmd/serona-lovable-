
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import Disclaimer from "./pages/Disclaimer";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Recommendations from "./pages/Recommendations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      gcTime: 0,
      enabled: false
    },
  },
});

// Enhanced SessionProvider component to handle OAuth redirects
const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth redirect and initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If we're on the OAuth callback URL (has ?code= parameter)
        if (location.search.includes('code=')) {
          // Wait a moment for the session to be fully established
          await new Promise(resolve => setTimeout(resolve, 100));
          // Then redirect to home, clearing the OAuth code from URL
          navigate('/', { replace: true });
        }
        
        if (error) {
          console.error('Error checking session:', error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error during session check:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
      
      if (event === 'SIGNED_IN') {
        // Force a session refresh when signed in
        await supabase.auth.getSession();
        // Clear any OAuth codes from URL
        if (location.search.includes('code=')) {
          navigate('/', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <SessionProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/recommendations/details" element={<Recommendations />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </SessionProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
