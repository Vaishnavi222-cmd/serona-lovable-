
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, X, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Basic auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        toast({
          title: "Authentication required",
          description: "Please sign in to access the chat.",
        });
      }
    };
    checkAuth();
  }, [navigate, toast]);

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-gray-800 h-14 flex items-center justify-between px-4 z-50">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Serona AI
        </Button>
      </header>

      <div className="flex h-full pt-14">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-14 w-64 bg-gray-800 transition-transform duration-300
                   ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
          style={{ height: 'calc(100vh - 56px)' }}
        >
          <ScrollArea className="h-full chat-scrollbar">
            {/* Search Bar with Close Button */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    className="w-full bg-gray-700 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] mt-[56px]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 chat-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button>Send</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
