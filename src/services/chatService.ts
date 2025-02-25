
import { supabase } from "@/integrations/supabase/client";

export const chatService = {
  async createChat(userId: string, userEmail: string) {
    const defaultTitle = 'New Chat';
    
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert([{
        title: defaultTitle,
        user_id: userId,
        user_email: userEmail
      }])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return newChat;
  },

  async saveMessage(chatId: string, message: string, userId: string, userEmail: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        chat_session_id: chatId,
        input_message: message,
        user_id: userId,
        user_email: userEmail
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async fetchMessages(chatId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};
