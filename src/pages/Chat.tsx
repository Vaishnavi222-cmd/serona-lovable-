
import { useState } from 'react';
import { Send, Menu, MessageSquare, Plus, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [chats] = useState([
    { id: 1, title: "Deep Personality Analysis", active: true },
    { id: 2, title: "Career Guidance Session", active: false },
    { id: 3, title: "Mental Health Support", active: false },
    { id: 4, title: "Life Goals Planning", active: false },
  ]);

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
      });
      return;
    }
    setMessage('');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-gray-200/50 transition-colors"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
      </button>

      {/* Sidebar - Mobile Optimized */}
      <div 
        className={`fixed md:relative chat-sidebar ${!isSidebarOpen ? 'closed' : ''} 
                   ${isMobile ? 'w-full md:w-64' : 'w-64'} z-40`}
      >
        <div className="p-4">
          <Button 
            className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB] text-white"
            onClick={() => {}}
          >
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        
        <div className="chat-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${chat.active ? 'active' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm truncate">{chat.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 flex flex-col h-screen relative w-full">
        {/* Navbar with Logo */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 px-4 py-2 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <img 
              src="/lovable-uploads/8ee7e32d-1c38-47e6-8e4e-c5cd0225a84c.png" 
              alt="Logo" 
              className="h-8 w-8"
            />
            <Navbar />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full p-4 space-y-8">
            {/* AI Message */}
            <div className="flex gap-6 animate-fade-up">
              <div className="w-8 h-8 rounded-lg bg-[#40E0D0] flex items-center justify-center text-white shrink-0">
                AI
              </div>
              <div className="flex-1 space-y-2 glass-card rounded-2xl p-6 shadow-sm">
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Message Input - Mobile Optimized */}
        <div className="sticky bottom-0 left-0 right-0 mx-auto w-full p-4 bg-white">
          <div className="relative max-w-4xl mx-auto">
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
              className="absolute right-3 bottom-3 p-2 rounded-full hover:bg-gray-100 
                       transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5 text-[#1EAEDB]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
