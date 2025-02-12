
import { useState, useEffect } from 'react';
import { Send, Menu, MessageSquare, Plus, X, Search } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        toast({
          title: "Error loading chats",
          description: error.message,
        });
        return;
      }

      if (chats) {
        setChats(chats);
        if (chats.length > 0 && !currentChatId) {
          setCurrentChatId(chats[0].id);
        }
      }
    };

    loadChats();
  }, [currentChatId, toast]);

  // Load messages for current chat
  useEffect(() => {
    if (!currentChatId) return;

    const loadMessages = async () => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: error.message,
        });
        return;
      }

      if (messages) {
        setMessages(messages);
      }
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${currentChatId}`,
      }, (payload) => {
        setMessages(current => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChatId, toast]);

  const handleSend = async () => {
    if (!message.trim() || !currentChatId) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send",
      });
      return;
    }

    const newMessage = {
      chat_id: currentChatId,
      content: message.trim(),
      sender: 'user' as const,
    };

    const { error } = await supabase
      .from('messages')
      .insert(newMessage);

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message,
      });
      return;
    }

    setMessage('');
  };

  const handleNewChat = async () => {
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({ title: 'New Chat' })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error creating chat",
        description: error.message,
      });
      return;
    }

    if (chat) {
      setChats(prev => [chat, ...prev]);
      setCurrentChatId(chat.id);
      setMessages([]);
      toast({
        title: "New chat created",
        description: "Started a new conversation",
      });
      setIsSidebarOpen(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-5 left-4 z-[60] p-2 rounded-md hover:bg-gray-200/50 transition-colors md:left-6"
      >
        {isSidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar */}
      <div 
        className={`fixed md:relative w-64 h-screen bg-black text-white overflow-hidden z-50
                   transition-transform duration-300 ease-in-out
                   ${!isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <ScrollArea className="h-full custom-scrollbar">
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

            {/* Brand */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-700">
              <img
                src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
                alt="Serona AI"
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold">Serona AI</span>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white"
                onClick={handleNewChat}
              >
                <Plus className="mr-2 h-4 w-4" /> New Chat
              </Button>
            </div>

            {/* Chat List */}
            <div className="flex-1 px-2 py-2 space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors
                             ${chat.id === currentChatId ? 'bg-gray-800' : ''}`}
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Header */}
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
              alt="Logo"
              className="h-8 w-8 ml-16 md:ml-20"
            />
          </div>
          <Navbar />
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-[#1EAEDB]/10 ml-auto max-w-[80%]' 
                    : 'bg-gray-100 mr-auto max-w-[80%]'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
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
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
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
