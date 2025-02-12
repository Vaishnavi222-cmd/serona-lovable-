
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  created_at: string;
  chat_id: string;
  user_id: string;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  updated_at: string;
}

export function useChatStore() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication status and get user ID
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  // Load chats
  useEffect(() => {
    if (!userId) return;

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
  }, [currentChatId, toast, userId]);

  // Load messages for current chat
  useEffect(() => {
    if (!currentChatId || !userId) return;

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
        const typedMessages = messages.map(msg => ({
          ...msg,
          sender: msg.sender as 'user' | 'ai'
        }));
        setMessages(typedMessages);
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
        const newMessage = payload.new as Message;
        setMessages(current => [...current, {
          ...newMessage,
          sender: newMessage.sender as 'user' | 'ai'
        }]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentChatId, toast, userId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentChatId || !userId) {
      toast({
        title: "Cannot send message",
        description: !userId ? "Please sign in to send messages" : "Please enter a message to send",
      });
      return;
    }

    const newMessage = {
      chat_id: currentChatId,
      content: content.trim(),
      sender: 'user' as const,
      user_id: userId,
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
  };

  const createNewChat = async () => {
    if (!userId) {
      toast({
        title: "Cannot create chat",
        description: "Please sign in to create a new chat",
      });
      return;
    }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({ 
        title: 'New Chat',
        user_id: userId
      })
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
    }
  };

  return {
    messages,
    chats,
    currentChatId,
    userId,
    setCurrentChatId,
    sendMessage,
    createNewChat
  };
}
