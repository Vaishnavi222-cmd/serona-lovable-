
import { supabase } from "@/integrations/supabase/client";

export async function createChat() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("User not found", error);
    return null;
  }

  const userId = user.id;
  const userEmail = user.email;

  if (!userId || !userEmail) {
    console.error("Missing user data: ", { userId, userEmail });
    return null;
  }

  const { data, error: insertError } = await supabase
    .from('chats')
    .insert([{ 
      title: 'New Chat',
      user_id: userId,
      user_email: userEmail
    }])
    .select();

  if (insertError) {
    console.error("Error inserting chat:", insertError);
    return null;
  }

  return data ? data[0] : null;
}

export async function saveMessage(chatId: string, message: string, userId: string, userEmail: string) {
  // Verify user authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated", authError);
    return null;
  }

  // Verify user matches
  if (user.id !== userId || user.email !== userEmail) {
    console.error("User mismatch");
    return null;
  }

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
    console.error("Error saving message:", error);
    return null;
  }
  return data;
}

export async function fetchChats(userId: string) {
  // Verify user authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== userId) {
    console.error("User not authenticated or mismatch", authError);
    return [];
  }

  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
  return data || [];
}

export async function fetchMessages(chatId: string) {
  // Verify user authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated", authError);
    return [];
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_session_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
}
