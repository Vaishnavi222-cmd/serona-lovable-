
import { useState } from 'react';
import { Send, Menu, MessageSquare, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "../components/Navbar";

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative bg-white dark:bg-[#343541] mt-16">
        {/* Messages Area with ScrollArea */}
        <ScrollArea className="flex-1 pt-4 pb-36">
          <div className="max-w-2xl mx-auto w-full p-4 md:p-8 space-y-6">
            {/* AI Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center text-white shrink-0">
                AI
              </div>
              <div className="flex-1 space-y-2">
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
              <div className="flex-1 space-y-2">
                <p className="prose dark:prose-invert prose-p:leading-relaxed prose-p:my-0">
                  Can you help me with personality analysis?
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Message Input - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#343541] border-t border-gray-200 dark:border-gray-700/50 p-4">
          <div className="max-w-2xl mx-auto relative">
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
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              AI Assistant is in beta. Messages may be reviewed for improvements.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
