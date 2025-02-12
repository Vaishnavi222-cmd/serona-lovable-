
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from '../auth/AuthDialog';

interface MessageInputProps {
  onSend: (message: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setShowAuthDialog(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInputInteraction = async () => {
    console.log("Auth Triggered: Checking session");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("Auth Triggered: No session found, showing dialog");
      setShowAuthDialog(true);
    }
  };

  const handleSend = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthDialog(true);
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Cannot send empty message",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    onSend(message);
    setMessage('');
  };

  return (
    <>
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={handleInputInteraction}
            onClick={handleInputInteraction}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Serona AI..."
            className="w-full p-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1EAEDB] 
                     bg-white border border-gray-200 shadow-sm resize-none text-gray-800
                     placeholder-gray-400 min-h-[44px] max-h-[200px]"
            rows={1}
          />
          <Button
            onClick={handleSend}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            variant="ghost"
          >
            <Send className="w-5 h-5 text-[#1EAEDB]" />
          </Button>
        </div>
      </div>
      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
    </>
  );
}
