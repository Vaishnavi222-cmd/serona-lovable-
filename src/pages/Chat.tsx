import { useState, useEffect, useRef } from 'react';
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
import { LimitReachedDialog } from "@/components/ui/limit-reached-dialog";
import { UpgradePlansDialog } from "@/components/ui/upgrade-plans-dialog";

interface Message {
  id: string;  // Changed from number to string to match UUID
  text: string;
  sender: 'user' | 'ai';
}

interface Chat {
  id: string;  // Changed from number to string to match UUID
  title: string;
  active: boolean;
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Changed to false by default
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarButtonRef = useRef<HTMLButtonElement>(null);
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: "Deep Personality Analysis", active: true },
    { id: '2', title: "Career Guidance Session", active: false },
    { id: '3', title: "Mental Health Support", active: false },
    { id: '4', title: "Life Goals Planning", active: false },
  ]);
  const [showLimitReachedDialog, setShowLimitReachedDialog] = useState(false);
  const [showUpgradePlansDialog, setShowUpgradePlansDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isLimitReached, setIsLimitReached] = useState(false);

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

    return () => {
      subscription.unsubscribe();
      controller.abort();
    };
  }, [toast]);

  const handleNewChat = async () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    try {
      // Create a new chat in the database
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          title: 'New Chat',
          user_id: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating new chat:', chatError);
        toast({
          title: "Error",
          description: "Failed to create new chat. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Clear current messages
      setMessages([]);
      setMessage('');
      
      // Update chats list
      const updatedChats = chats.map(chat => ({ ...chat, active: false }));
      updatedChats.unshift({ 
        id: newChat.id, 
        title: newChat.title, 
        active: true 
      });
      setChats(updatedChats);

      // Close sidebar on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat. Please try again.",
        variant: "destructive",
      });
    }
  };

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

    if (isLimitReached) {
      setShowLimitReachedDialog(true);
      return;
    }
    
    try {
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-plan-limits', {
        body: { 
          input_tokens: message.length,
          output_tokens: 400
        }
      });

      if (limitError || !limitCheck.allowed) {
        const errorMessage = limitError?.message || limitCheck?.error || "Usage limit reached";
        
        const timeMatch = errorMessage.match(/resets in (\d+) minutes/);
        if (timeMatch) {
          const minutes = parseInt(timeMatch[1]);
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          setTimeRemaining(
            hours > 0 
              ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `${remainingMinutes} minutes` : ''}`
              : `${minutes} minutes`
          );
        }

        setIsLimitReached(true);
        setShowLimitReachedDialog(true);
        return;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      if (limitCheck.warning) {
        toast({
          title: "Token Usage Warning",
          description: limitCheck.warning,
        });
      }
    } catch (error) {
      console.error('Error checking limits:', error);
      toast({
        title: "Error",
        description: "Failed to check usage limits. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectPlan = async (planType: 'hourly' | 'daily' | 'monthly') => {
    console.log('Selected plan:', planType);
  };

  const handleQuickStart = (topic: string) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    
    if (isLimitReached) {
      setShowLimitReachedDialog(true);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: `Help me with ${topic}`,
      sender: 'user'
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const HeaderMenu = () => (
    <>
      <button
        ref={menuButtonRef}
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (e.key === 'Enter' && !e.shiftKey && !isMobileDevice) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    setMessage(e.target.value);
  };

  useEffect(() => {
    document.title = "Serona AI – AI That Understands You & Guides You Forward";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Serona AI - Your personal AI companion for growth and guidance. Get personalized support for deep personality analysis, career guidance, and more.');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile) {
        // Handle header menu
        if (showHeaderMenu && 
            headerMenuRef.current && 
            !headerMenuRef.current.contains(event.target as Node) &&
            menuButtonRef.current && 
            !menuButtonRef.current.contains(event.target as Node)) {
          setShowHeaderMenu(false);
        }

        // Handle sidebar
        if (isSidebarOpen && 
            sidebarRef.current && 
            !sidebarRef.current.contains(event.target as Node) &&
            sidebarButtonRef.current && 
            !sidebarButtonRef.current.contains(event.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, showHeaderMenu, isSidebarOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />

      <div 
        ref={sidebarRef}
        className={`fixed md:relative w-64 h-screen bg-black text-white overflow-auto z-40
                   transition-transform duration-300 ease-in-out mt-[56px]
                   ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ height: 'calc(100vh - 56px)' }}
      >
        <div className="h-full overflow-y-auto custom-scrollbar">
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
              onClick={handleNewChat}
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
        </div>
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
                ref={sidebarButtonRef}
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-800/50 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-[#40E0D0] stroke-[2.5px]" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div ref={headerMenuRef}>
              <HeaderMenu />
            </div>
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
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-[800px] w-full mx-auto py-6 px-4 md:px-8">
              {messages.length === 0 && !message ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] max-w-4xl mx-auto px-4 mt-8">
                  <h1 className="text-lg md:text-2xl font-playfair font-semibold text-gray-800 text-center mb-8 md:mb-12 leading-relaxed px-4">
                    Hello! I'm your personal growth partner—here to support and guide you! 💡 Let me know how I can help😊
                  </h1>
                  <div className="grid grid-cols-2 gap-2 md:gap-6 w-full max-w-2xl px-2 md:px-4">
                    <Button
                      onClick={() => handleQuickStart("Deep Personality Analysis")}
                      className="p-3 md:p-6 h-auto flex flex-col items-center gap-2 md:gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Brain className="w-5 h-5 md:w-6 md:h-6 text-[#1EAEDB]" />
                      <span className="text-sm md:text-base text-center whitespace-pre-line">Deep{'\n'}Personality Analysis</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Career Guidance")}
                      className="p-3 md:p-6 h-auto flex flex-col items-center gap-2 md:gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-[#1EAEDB]" />
                      <span className="text-sm md:text-base text-center">Career Guidance</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Decision Making")}
                      className="p-3 md:p-6 h-auto flex flex-col items-center gap-2 md:gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Scale className="w-5 h-5 md:w-6 md:h-6 text-[#1EAEDB]" />
                      <span className="text-sm md:text-base text-center">Decision Making</span>
                    </Button>
                    <Button
                      onClick={() => handleQuickStart("Relationship Advice")}
                      className="p-3 md:p-6 h-auto flex flex-col items-center gap-2 md:gap-3 bg-white border-2 border-gray-200 hover:border-[#1EAEDB] hover:bg-gray-50 text-gray-800"
                      variant="outline"
                    >
                      <Heart className="w-5 h-5 md:w-6 md:h-6 text-[#1EAEDB]" />
                      <span className="text-sm md:text-base text-center">Relationship Advice</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      } w-full`}
                    >
                      <div
                        className={`relative rounded-lg break-words
                          ${msg.sender === 'user' 
                            ? 'bg-[#1EAEDB]/10 ml-auto mr-0' 
                            : 'bg-gray-100 mr-auto ml-0'
                          }
                          max-w-[92%] md:max-w-[85%] px-6 py-4`}
                      >
                        <p className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:sticky w-full bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              <textarea
                value={message}
                onChange={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                placeholder="Message Serona AI..."
                className="w-full p-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1EAEDB] 
                         bg-white border border-gray-200 shadow-sm resize-none text-gray-800
                         placeholder-gray-400 min-h-[44px] max-h-[200px] overflow-y-auto"
                style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                rows={1}
                disabled={isLimitReached}
              />
              <button 
                onClick={handleSend}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Send message"
                disabled={isLimitReached}
              >
                <Send className="w-5 h-5 text-[#1EAEDB]" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LimitReachedDialog
        open={showLimitReachedDialog}
        onOpenChange={setShowLimitReachedDialog}
        timeRemaining={timeRemaining}
        onUpgrade={() => {
          setShowLimitReachedDialog(false);
          setShowUpgradePlansDialog(true);
        }}
      />

      <UpgradePlansDialog
        open={showUpgradePlansDialog}
        onOpenChange={setShowUpgradePlansDialog}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
};

export default Chat;
