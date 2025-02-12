
import { useState } from 'react';
import { MessageSquare, Plus, X, Search, Menu } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Chat } from '@/hooks/use-chat-store';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-5 left-4 z-[60] p-2 rounded-md hover:bg-gray-200/50 transition-colors md:left-6"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      <div 
        className={`fixed md:relative w-64 h-screen bg-black text-white overflow-hidden z-50
                   transition-transform duration-300 ease-in-out
                   ${!isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <ScrollArea className="h-full custom-scrollbar">
          <div className="flex flex-col h-full">
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

            <div className="p-4 flex items-center gap-3 border-b border-gray-700">
              <img
                src="/lovable-uploads/dc45c119-80a0-499e-939f-f434d6193c98.png"
                alt="Serona AI"
                className="w-8 h-8"
              />
              <span className="text-lg font-semibold">Serona AI</span>
            </div>

            <div className="p-4">
              <Button 
                className="w-full bg-[#1EAEDB] hover:bg-[#1EAEDB]/90 text-white"
                onClick={onNewChat}
              >
                <Plus className="mr-2 h-4 w-4" /> New Chat
              </Button>
            </div>

            <div className="flex-1 px-2 py-2 space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors
                             ${chat.id === currentChatId ? 'bg-gray-800' : ''}`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
