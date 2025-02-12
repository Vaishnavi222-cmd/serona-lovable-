
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from '@/hooks/use-chat-store';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
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
  );
}
