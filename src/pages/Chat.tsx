import { useState } from 'react';
import { Send, Plus, Menu, MessageSquare, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from '../components/Navbar';

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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex h-[calc(100vh-64px)] relative">
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? 'w-72' : 'w-0'
          } bg-[#202123] transition-all duration-300 overflow-hidden flex flex-col h-full fixed left-0 top-16 bottom-0 z-20 md:relative md:top-0`}
        >
          <div className="p-3">
            <button 
              className="w-full py-3 px-4 bg-serona-primary/10 text-serona-primary rounded-lg hover:bg-serona-primary/20 transition-colors flex items-center justify-center gap-2 font-medium"
              onClick={() => {
                toast({
                  title: "New Chat",
                  description: "Starting a new chat session",
                });
              }}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    chat.active 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm truncate text-left flex-1">{chat.title}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className={`flex-1 flex flex-col bg-white relative ${isSidebarOpen ? 'md:ml-72' : ''}`}>
          {/* Header */}
          <div className="sticky top-16 md:top-0 z-10 bg-white border-b border-gray-200 flex items-center h-14 px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="ml-4 font-medium text-gray-700">AI Assistant</h1>
          </div>
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
              <div className="space-y-6">
                {/* AI Message */}
                <div className="flex gap-4 animate-fade-up">
                  <div className="w-8 h-8 rounded-full bg-serona-primary flex items-center justify-center text-white shrink-0">
                    AI
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 leading-relaxed shadow-sm">
                    <p>Hello! I'm your AI assistant. How can I help you today?</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex gap-4 animate-fade-up">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 leading-relaxed shadow-sm">
                    <p>Can you help me with career guidance?</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
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
                placeholder="Type your message..."
                className="w-full p-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-serona-primary bg-gray-50 shadow-sm min-h-[60px] resize-none border border-gray-200"
                rows={1}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-serona-primary transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-center mt-2 text-gray-500">
              AI Assistant is in beta. Messages may be reviewed for improvements.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;