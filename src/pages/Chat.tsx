
import { useState, useEffect } from 'react';
import { Send, Menu, MessageSquare, Plus, X, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { AuthDialog } from "@/components/ui/auth-dialog";
import { UserMenu } from "@/components/UserMenu";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [chats] = useState([
    { id: 1, title: "Deep Personality Analysis", active: true },
    { id: 2, title: "Career Guidance Session", active: false },
    { id: 3, title: "Mental Health Support", active: false },
    { id: 4, title: "Life Goals Planning", active: false },
  ]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking session:', error);
        return;
      }
      setUser(session?.user ?? null);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthDialog(false);
        toast({
          title: "Successfully authenticated",
          description: "You can now send messages",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
      });
      return;
    }

    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    const newMessage: Message = {
      id: Date.now(),
      text: message.trim(),
      sender: 'user'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    console.log("Message sent:", newMessage);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />

      {/* Header */}
      <div className="bg-black text-white w-full fixed top-0 left-0 right-0 px-4 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
              alt="Logo"
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold hidden md:inline">Serona AI</span>
            {/* Three-line menu icon */}
            {!isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="inline-flex p-2 rounded-md hover:bg-gray-800/50 transition-colors ml-4"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6 text-[#40E0D0] stroke-2" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Profile icon with adjusted spacing */}
          {user && (
            <div className="flex items-center justify-center mr-6">
              <UserMenu userEmail={user.email} />
            </div>
          )}
          <Navbar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full h-screen pt-14">
        {/* Sidebar */}
        <div 
          className={`fixed md:relative w-64 h-[calc(100vh-3.5rem)] bg-black text-white overflow-hidden z-40
                     transition-transform duration-300 ease-in-out
                     ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
        >
          <ScrollArea className="h-full custom-scrollbar">
            {/* Search Bar with Close Button */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-800 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Serona AI Brand */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-700">
              <img
                src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
                alt="Serona AI"
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold">Serona AI</span>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white"
                onClick={() => {}}
              >
                <Plus className="mr-2 h-4 w-4" /> New Chat
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 px-2 py-2 space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors
                             ${chat.active ? 'bg-gray-800' : ''}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-[#1EAEDB]/10 ml-auto max-w-[80%]' 
                      : 'bg-gray-100 mr-auto max-w-[80%]'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
              <button 
                onClick={handleSend}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 text-[#1EAEDB]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
