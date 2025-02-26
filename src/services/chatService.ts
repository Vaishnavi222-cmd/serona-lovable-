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
    console.log("🔍 DEBUG - Starting saveMessage with FULL params:", {
      chatId,
      message,
      messageLength: message.length,
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error("❌ Authentication error in saveMessage:", {
        error: sessionError,
        hasSession: !!session,
        hasUser: session?.user ? true : false
      });
      throw new Error("Authentication required");
    }

    if (session.user.id !== userId) {
      console.error("❌ User mismatch in saveMessage:", {
        sessionUserId: session.user.id,
        providedUserId: userId
      });
      throw new Error("User authentication mismatch");
    }

    // Verify chat exists and belongs to user
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('id, user_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chatData) {
      console.error("❌ Chat verification failed:", {
        error: chatError,
        chatId,
        userId
      });
      throw new Error("Chat verification failed");
    }

    if (chatData.user_id !== userId) {
      console.error("❌ Chat ownership verification failed:", {
        chatUserId: chatData.user_id,
        requestUserId: userId
      });
      throw new Error("Chat ownership verification failed");
    }

    const insertData = {
      chat_session_id: chatId,
      content: message,
      user_id: userId,
      sender: 'user'
    };

    console.log("🔍 DEBUG - Attempting to insert message with data:", insertData);

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error saving message to 'messages' table:", {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        details: error.details,
        hint: error.hint,
        insertData
      });
      throw error;
    }

    console.log("✅ Message saved successfully to 'messages' table:", {
      savedData: data,
      chatId,
      messageId: data.id,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error: any) {
    console.error("❌ Detailed error in saveMessage:", {
      error,
      errorMessage: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function fetchMessages(chatId: string) {
  try {
    console.log("🔍 Starting fetchMessages for chatId:", chatId);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error("❌ Session error in fetchMessages:", {
        error: sessionError,
        hasSession: !!session,
        hasUser: session?.user ? true : false
      });
      return [];
    }

    console.log("🔍 Attempting to fetch messages from 'messages' table:", {
      chatId,
      userId: session.user.id
    });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("❌ Error fetching messages:", {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        details: error.details,
        hint: error.hint,
        chatId
      });
      return [];
    }

    console.log("✅ Messages fetched successfully:", {
      messageCount: data?.length || 0,
      chatId,
      firstMessage: data?.[0],
      timestamp: new Date().toISOString()
    });
    
    return data || [];
  } catch (error) {
    console.error("❌ Unexpected error in fetchMessages:", {
      error,
      chatId,
      timestamp: new Date().toISOString()
    });
    return [];
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
