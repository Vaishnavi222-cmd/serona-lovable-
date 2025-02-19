import { useState } from "react";
import { Bot, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePlanStatus } from "@/hooks/use-plan-status";
import LoginDialog from "@/components/LoginDialog";
import LimitReachedDialog from "@/components/ui/limit-reached-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const Chat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [limitReachedOpen, setLimitReachedOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkPlanLimits } = usePlanStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setLoginOpen(true);
      return;
    }

    const canUse = await checkPlanLimits();
    if (!canUse) {
      setLimitReachedOpen(true);
      return;
    }

    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
            <Bot className="w-12 h-12 mb-4 text-serona-primary" />
            <h2 className="text-2xl font-semibold mb-2 text-serona-dark">Welcome to Serona AI Chat!</h2>
            <p className="text-gray-600 mb-4">
              I'm here to help you explore your thoughts, feelings, and behaviors.
              Start by sharing what's on your mind, and together we'll work on your
              personal growth journey.
            </p>
            <div className="text-sm text-gray-500">
              Your conversations are private and secure.
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-serona-primary text-serona-dark ml-4"
                    : "bg-gray-100 text-gray-800 mr-4"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] md:max-w-[70%] space-y-2 mr-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[160px]" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2 max-w-5xl mx-auto">
          {messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearChat}
              className="shrink-0"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <LimitReachedDialog open={limitReachedOpen} onOpenChange={setLimitReachedOpen} />
    </div>
  );
};

export default Chat;
