
import { useState } from 'react';
import { Send, Menu, MessageSquare, Plus, X, Search } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
        className="fixed top-5 left-4 z-50 p-2 rounded-md hover:bg-gray-200/50 transition-colors"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed md:relative w-64 h-full bg-black text-white 
                      transition-all duration-300 ease-in-out transform 
                      ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'} z-40`}>
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pl-10 pr-10"
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

          {/* Serona AI Brand */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-700">
            <img
              src="/lovable-uploads/d8b2ad73-4464-4f87-9b00-45c2a93902b0.png"
              alt="Serona AI"
              className="w-8 h-8"
            />
            <span className="text-lg font-semibold">Serona AI</span>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button 
              className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white"
              onClick={() => {}}
            >
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="flex flex-col gap-2 p-2">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Header */}
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/d8b2ad73-4464-4f87-9b00-45c2a93902b0.png"
              alt="Logo"
              className="h-8 w-8 ml-12"
            />
          </div>
          <Navbar />
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-3xl mx-auto w-full p-4 space-y-8">
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-white">
          <div className="max-w-4xl mx-auto relative">
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
