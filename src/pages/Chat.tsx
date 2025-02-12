
import { useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "../components/Navbar";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChatStore } from "@/hooks/use-chat-store";

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
          </div>
          <Navbar />
        </div>

        <MessageList messages={messages} />
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}

export default Chat;
