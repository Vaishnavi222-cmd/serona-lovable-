import { useState } from 'react';
import { Send, Plus, Menu, MessageSquare } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();
  const [chats] = useState([
    { id: 1, title: "Understanding AI Basics", active: true },
    { id: 2, title: "Machine Learning Discussion", active: false },
    { id: 3, title: "Neural Networks Explained", active: false },
    { id: 4, title: "Data Processing Methods", active: false },
  ]);

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
      });
      return;
    }
    // Handle message sending logic here
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16 flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside 
          className={`${
            isSidebarOpen ? 'w-80' : 'w-0'
          } bg-serona-dark transition-all duration-300 overflow-hidden flex flex-col h-full`}
        >
          <div className="p-4">
            <button 
              className="w-full py-3 px-4 bg-serona-primary text-serona-dark rounded-lg hover:bg-serona-accent transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="px-2 space-y-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    chat.active 
                      ? 'bg-serona-primary/20 text-serona-primary' 
                      : 'text-serona-secondary hover:bg-serona-dark/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm truncate text-left flex-1">{chat.title}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-serona-light rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Chat messages would go here */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {/* Example messages */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-serona-primary flex items-center justify-center text-white">
                    AI
                  </div>
                  <div className="flex-1 bg-serona-light rounded-lg p-4">
                    <p>Hello! How can I assist you today?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="max-w-4xl mx-auto relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="w-full p-4 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-serona-primary bg-white"
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-serona-primary hover:text-serona-accent transition-colors"
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