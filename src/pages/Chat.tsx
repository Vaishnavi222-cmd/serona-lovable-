import { useState, useEffect } from 'react';
import { Send, Menu, MessageSquare, Plus, X, Search, LogIn, Brain, Briefcase, Scale, Heart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { AuthDialog } from "@/components/ui/auth-dialog";
import { UserMenu } from "@/components/UserMenu";
import { Link } from 'react-router-dom';

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
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [chats] = useState([
    { id: 1, title: "Deep Personality Analysis", active: true },
    { id: 2, title: "Career Guidance Session", active: false },
    { id: 3, title: "Mental Health Support", active: false },
    { id: 4, title: "Life Goals Planning", active: false },
  ]);

  // Clear any potential background processes on component mount/unmount
  useEffect(() => {
    const controller = new AbortController();
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking session:', error);
          return;
        }
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

    // Cleanup function to abort any pending operations
    return () => {
      subscription.unsubscribe();
      controller.abort();
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
  };

  const handleQuickStart = (topic: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    const newMessage: Message = {
      id: Date.now(),
      text: `Help me with ${topic}`,
      sender: 'user'
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Header menu links component
  const HeaderMenu = () => (
    <>
      <button
        onClick={() => setShowHeaderMenu(!showHeaderMenu)}
        className="md:hidden p-2 rounded-md hover:bg-gray-800/50 transition-colors"
        aria-label="Toggle header menu"
      >
        <Menu className="w-5 h-5 text-[#40E0D0]" />
      </button>

      <nav className={`${
        isMobile 
          ? `absolute top-[56px] right-0 bg-black w-48 py-2 ${showHeaderMenu ? 'block' : 'hidden'}`
          : 'flex items-center space-x-6'
      }`}>
        <div className={`${isMobile ? 'flex flex-col' : 'flex items-center space-x-6'}`}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
          <NavLink to="/recommendations">Recommendations</NavLink>
        </div>
      </nav>
    </>
  );

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className={`text-white hover:text-[#40E0D0] transition-colors duration-300 font-medium ${
        isMobile ? 'block px-4 py-2 hover:bg-gray-800/50' : ''
      }`}
      onClick={() => setShowHeaderMenu(false)}
    >
      {children}
    </Link>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />

      {/* Sidebar */}
      <div 
        className={`fixed md:relative w-64 h-screen bg-black text-white overflow-hidden z-40
                   transition-transform duration-300 ease-in-out mt-[56px]
                   ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ height: 'calc(100vh - 56px)' }}
      >
        <ScrollArea className="h-full custom-scrollbar">
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

          <div className="p-4 flex items-center gap-3 border-b border-gray-700">
            <img
              src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
              alt="Serona AI"
              className="w-8 h-8"
            />
            <span className="text-lg font-semibold">Serona AI</span>
          </div>

          <div className="p-4">
            <Button 
              className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white"
              onClick={() => {}}
            >
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>

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

      <div className="flex-1 flex flex-col">
        <div className="bg-black text-white fixed top-0 left-0 right-0 px-4 py-2 flex items-center justify-between z-50 h-[56px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
                alt="Logo"
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold hidden md:inline">Serona AI</span>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-800/50 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-[#40E0D0] stroke-[2.5px]" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <HeaderMenu />
            {user ? (
              <div className="flex items-center justify-center w-10 h-10">
                <UserMenu userEmail={user.email} />
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                variant="ghost"
                className="flex items-center gap-2 text-white hover:bg-gray-800/50"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] mt-[56px]">
          <ScrollArea className="flex-1 p-4 custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && !message ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] max-w-4xl mx-auto px-4 mt-8">
                  <h1 className="text-2xl font-playfair font-semibold text-gray-800 text-center mb-12 leading-relaxed">
                    Hello, I am your personal growth partner. Let me know how I can help you.
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                    <Button
                      onClick={() => handleQuickStart("Deep Personality Analysis")}
                      className="p-6 h-auto flex flex-col items-center gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Brain className="w-6 h-6 text-[#1EAEDB]" />
                      <span>Deep Personality Analysis</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Career Guidance")}
                      className="p-6 h-auto flex flex-col items-center gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Briefcase className="w-6 h-6 text-[#1EAEDB]" />
                      <span>Career Guidance</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Decision Making")}
                      className="p-6 h-auto flex flex-col items-center gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Scale className="w-6 h-6 text-[#1EAEDB]" />
                      <span>Decision Making</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Relationship Advice")}
                      className="p-6 h-auto flex flex-col items-center gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Heart className="w-6 h-6 text-[#1EAEDB]" />
                      <span>Relationship Advice</span>
                    </Button>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
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
                ))
              )}
            </div>
          </ScrollArea>

          <div className="fixed bottom-0 left-0 right-0 md:sticky w-full bg-white border-t border-gray-200 p-4">
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
