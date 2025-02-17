import { useState, useEffect } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChatStore } from "@/hooks/use-chat-store";
import { Menu } from "lucide-react";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default false
  const isMobile = useIsMobile();
  const {
    messages,
    chats,
    currentChatId,
    sendMessage,
    setCurrentChatId,
    createNewChat
  } = useChatStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fix "Message Serona AI" box visibility issue on load
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={createNewChat}
      />

      <div className="flex-1 flex flex-col h-screen relative">
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <img
              src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
              alt="Logo"
              className="h-8 w-8 ml-16 md:ml-20"
            />
            <span className="text-lg font-semibold hidden md:inline">Serona AI</span>
          </div>
          {/* Three-line menu icon (fixed positioning for visibility) */}
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-800/50 transition-colors ml-4"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6 text-[#40E0D0] stroke-2" />
            </button>
          )}
          <Navbar />
        </div>

        <MessageList messages={messages} />
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
};

export default Chat;
