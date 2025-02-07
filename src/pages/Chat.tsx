
import { useState } from 'react';
import { Send, Menu, MessageSquare, User, Plus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

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

  return (
    <div className="flex h-screen bg-white dark:bg-[#343541] overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 h-screen bg-[#202123] flex flex-col overflow-hidden`}>
        <div className="p-4">
          <Button 
            className="w-full bg-transparent border border-white/20 hover:bg-white/10 text-white"
            onClick={() => {}}
          >
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`w-full text-left px-3 py-3 rounded-lg mb-1 flex items-center text-sm 
                ${chat.active 
                  ? 'bg-[#343541] text-white' 
                  : 'text-gray-300 hover:bg-[#343541]'}`}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              {chat.title}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Navbar */}
        <div className="fixed top-0 right-0 left-0 z-50 bg-white dark:bg-[#343541] border-b dark:border-gray-700/50">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <Menu className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            </button>
            <Navbar />
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pt-16 pb-36">
          <div className="max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6">
            {/* AI Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center text-white shrink-0">
                AI
              </div>
              <div className="flex-1 space-y-2 bg-white/5 rounded-lg p-4 shadow-sm">
                <p className="prose dark:prose-invert prose-p:leading-relaxed prose-p:my-0">
                  Hello! I'm your AI assistant. How can I help you today?
                </p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#3b3b3f] flex items-center justify-center text-white shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2 bg-white/5 rounded-lg p-4 shadow-sm">
                <p className="prose dark:prose-invert prose-p:leading-relaxed prose-p:my-0">
                  Can you help me with personality analysis?
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#343541] border-t border-gray-200 dark:border-gray-700/50 p-4">
          <div className="max-w-3xl mx-auto relative">
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
                       bg-white dark:bg-[#40414f] border border-gray-200 dark:border-gray-700/50 
                       shadow-[0_0_10px_rgba(0,0,0,0.05)] resize-none dark:text-white 
                       dark:placeholder-gray-400 min-h-[44px] max-h-[200px]"
              rows={1}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-1.5 text-gray-500 hover:text-[#19c37d] 
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
