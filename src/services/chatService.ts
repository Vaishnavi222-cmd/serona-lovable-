
import { supabase } from "@/integrations/supabase/client";

export async function createChat(userId: string, userEmail: string) {
  const { data, error } = await supabase
    .from('chats')
    .insert([{ 
      title: 'New Chat',
      user_id: userId,
      user_email: userEmail
    }])
    .select();
  
  if (error) {
    console.error(error);
    return null;
  }
  return data ? data[0] : null;
}

export async function saveMessage(chatId: string, message: string, userId: string, userEmail: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ 
      chat_session_id: chatId,
      input_message: message,
      user_id: userId,
      user_email: userEmail
    }])
    .select()
    .maybeSingle();
  
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

export async function fetchChats(userId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

export async function fetchMessages(chatId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_session_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}
