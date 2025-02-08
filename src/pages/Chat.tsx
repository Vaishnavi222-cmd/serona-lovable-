
import { useState } from 'react';
import { Send, Menu, MessageSquare, User, Plus, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
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
        className="sidebar-toggle"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-gray-800" /> : <Menu className="w-6 h-6 text-gray-800" />}
      </button>

      {/* Sidebar */}
      <div className={`chat-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="p-4">
          <Button 
            className="w-full bg-[#1EAEDB] hover:bg-[#0FA0CE] text-white border-none"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Navbar with Logo */}
        <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 px-4 py-2">
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
                <p className="text-gray-800">
                  Hello! I'm your AI assistant. How can I help you today?
                </p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-6 animate-fade-up justify-end">
              <div className="flex-1 space-y-2 bg-gray-100 rounded-2xl p-6 shadow-sm">
                <p className="text-gray-800">
                  Can you help me with personality analysis?
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-white shrink-0">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Centered Message Input */}
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-3xl w-full p-4 mb-8">
          <div className="relative">
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
              className="w-full p-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#40E0D0] 
                       bg-white border border-gray-200
                       shadow-[0_0_10px_rgba(0,0,0,0.05)] resize-none text-gray-800
                       placeholder-gray-400 min-h-[44px] max-h-[200px]"
              rows={1}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-[#40E0D0] 
                       transition-colors rounded"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
