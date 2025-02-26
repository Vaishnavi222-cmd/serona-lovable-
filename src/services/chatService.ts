
import { supabase } from "@/integrations/supabase/client";

export async function createChat() {
  try {
    console.log("🔍 DEBUG - Starting createChat...");
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error("❌ Session error or no user:", {
        error: sessionError,
        session: session,
        hasUser: session?.user ? true : false,
        rawSession: session
      });
      return { error: "Authentication error", data: null };
    }

    const user = session.user;
    
    console.log("✅ Creating chat with user data:", {
      userId: user.id,
      userEmail: user.email,
      sessionState: true,
      authenticated: true
    });

    const { data, error: insertError } = await supabase
      .from('chats')
      .insert([{ 
        title: 'New Chat',
        user_id: user.id,
        user_email: user.email
      }])
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("❌ Error creating chat:", insertError);
      return { error: insertError.message, data: null };
    }

    console.log("✅ Chat created successfully:", data);
    return { error: null, data };
  } catch (error: any) {
    console.error("❌ Unexpected error in createChat:", error);
    return { error: error.message, data: null };
  }
}

export async function saveMessage(chatId: string, message: string, userId: string, userEmail: string) {
  try {
    console.log("🔍 DEBUG - Starting saveMessage with params:", {
      chatId,
      messageLength: message.length,
      userId
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error("❌ Authentication error:", sessionError);
      throw new Error("Authentication required");
    }

    if (session.user.id !== userId) {
      console.error("❌ User mismatch");
      throw new Error("User authentication mismatch");
    }

    const insertData = {
      chat_session_id: chatId,
      content: message,
      user_id: userId,
      sender: 'user'
    };

    console.log("🔍 DEBUG - Inserting message:", insertData);

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error saving message:", error);
      throw error;
    }

    console.log("✅ Message saved successfully:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Error in saveMessage:", error);
    throw error;
  }
}

export async function fetchChats(userId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user || session.user.id !== userId) {
      console.error("Session error or user mismatch:", sessionError);
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
    
    console.log("✅ Fetched chats:", data);
    return data || [];
  } catch (error) {
    console.error("Unexpected error in fetchChats:", error);
    return [];
  }
}

export async function fetchMessages(chatId: string) {
  try {
    console.log("🔍 Starting fetchMessages for chatId:", chatId);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("❌ Error fetching messages:", error);
      return [];
    }

    console.log("✅ Messages fetched:", data?.length || 0, "messages");
    return data || [];
  } catch (error) {
    console.error("❌ Unexpected error in fetchMessages:", error);
    return [];
  }
}
