import { useState } from 'react';
import { Send, Plus, Menu, MessageSquare, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-[260px]' : 'w-0'
        } fixed inset-y-0 left-0 z-50 bg-[#202123] transition-all duration-300 overflow-hidden flex flex-col h-screen md:relative`}
      >
        <div className="p-2">
          <button 
            className="w-full h-12 flex items-center gap-3 px-3 text-sm text-white bg-transparent hover:bg-gray-700/50 rounded-lg border border-white/20 transition-colors"
            onClick={() => {
              toast({
                title: "New Chat",
                description: "Starting a new chat session",
              });
            }}
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>
        
        <ScrollArea className="flex-1 px-2 py-2 custom-scrollbar">
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={`w-full h-12 flex items-center gap-3 px-3 text-sm rounded-lg transition-colors ${
                  chat.active 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate text-left flex-1">{chat.title}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative bg-white dark:bg-[#343541] w-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-white dark:bg-[#343541] border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center h-12 px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="ml-4 font-medium text-gray-700 dark:text-gray-200">AI Assistant</h1>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 pt-12 pb-36 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full p-4 md:p-8 space-y-6">
            {/* AI Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#19c37d] flex items-center justify-center text-white shrink-0 mt-1">
                AI
              </div>
              <div className="flex-1 space-y-2">
                <p className="prose prose-slate dark:prose-invert prose-p:leading-relaxed prose-p:my-0">
                  Hello! I'm your AI assistant. How can I help you today?
                </p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex gap-4 animate-fade-up">
              <div className="w-8 h-8 rounded-sm bg-[#3b3b3f] flex items-center justify-center text-white shrink-0 mt-1">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="prose prose-slate dark:prose-invert prose-p:leading-relaxed prose-p:my-0">
                  Can you help me with career guidance?
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
              placeholder="Message ChatGPT..."
              className="w-full p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#19c37d] bg-white dark:bg-[#40414f] border border-gray-200 dark:border-gray-700/50 shadow-[0_0_10px_rgba(0,0,0,0.05)] resize-none dark:text-white dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 bottom-3 p-1.5 text-gray-500 hover:text-[#19c37d] transition-colors rounded"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-3xl mx-auto">
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