
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
    <div className="flex h-screen overflow-hidden bg-[#343541]">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="sidebar-toggle"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar */}
      <div className={`chat-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="p-4">
          <Button 
            className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white"
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
        {/* Navbar */}
        <div className="bg-[#343541] border-b border-gray-700/50 px-4 py-2">
          <Navbar />
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full p-4 space-y-6">
            {/* AI Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center text-white shrink-0">
                AI
              </div>
              <div className="flex-1 space-y-2 bg-gray-800/50 rounded-lg p-4 shadow-sm">
                <p className="text-gray-100">
                  Hello! I'm your AI assistant. How can I help you today?
                </p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-4 animate-fade-up justify-end">
              <div className="flex-1 space-y-2 bg-blue-600/10 rounded-lg p-4 shadow-sm">
                <p className="text-gray-100">
                  Can you help me with personality analysis?
                </p>
              </div>
              <div className="w-8 h-8 rounded-sm bg-[#3b3b3f] flex items-center justify-center text-white shrink-0">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="chat-input-container">
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
              className="w-full p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#19c37d] 
                       bg-[#40414f] border border-gray-700/50 
                       shadow-[0_0_10px_rgba(0,0,0,0.05)] resize-none text-white 
                       placeholder-gray-400 min-h-[44px] max-h-[200px]"
              rows={1}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-[#19c37d] 
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
