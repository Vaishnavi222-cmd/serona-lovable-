
import { supabase } from "@/integrations/supabase/client";

export async function createChat() {
  try {
    console.log("🔍 DEBUG - Starting createChat...");
    
    // Try to refresh the session first
    console.log("🔄 DEBUG - Refreshing session...");
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    console.log("🔄 DEBUG - Session refresh result:", {
      success: !refreshError,
      error: refreshError,
      session: refreshData?.session ? {
        hasUser: refreshData.session.user ? true : false,
        hasEmail: refreshData.session.user?.email ? true : false,
        userDetails: refreshData.session.user ? {
          id: refreshData.session.user.id,
          email: refreshData.session.user.email,
          metadata: refreshData.session.user.user_metadata,
          rawUser: refreshData.session.user
        } : null,
        rawSession: refreshData.session
      } : null
    });

    if (refreshError) {
      console.error("❌ Session refresh error:", refreshError);
    }

    // Get the current session
    console.log("🔄 DEBUG - Getting fresh session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log("🔍 DEBUG - Session check result:", {
      hasSession: session ? true : false,
      error: sessionError,
      sessionDetails: session ? {
        hasUser: session.user ? true : false,
        hasEmail: session.user?.email ? true : false,
        userDetails: session.user ? {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata,
          rawUser: session.user
        } : null,
        rawSession: session
      } : null
    });

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
      authenticated: true,
      metadata: user.user_metadata,
      rawUser: user
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
      console.error("❌ Error creating chat:", {
        error: insertError,
        user: user,
        hasEmail: user.email ? true : false,
        rawUser: user
      });
      return { error: insertError.message, data: null };
    }

    console.log("✅ Chat created successfully:", {
      chatData: data,
      userData: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      }
    });
    
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
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    });

    // Verify session and user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("🔍 DEBUG - Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionError: sessionError,
      sessionUserId: session?.user?.id,
      requestUserId: userId,
      matchingIds: session?.user?.id === userId
    });

    if (sessionError || !session?.user) {
      console.error("❌ Authentication error:", {
        error: sessionError,
        session: session,
        userId: userId
      });
      throw new Error("Authentication required");
    }

    // Verify user matches session
    if (session.user.id !== userId) {
      console.error("❌ User mismatch:", {
        sessionUserId: session.user.id,
        requestUserId: userId
      });
      throw new Error("User authentication mismatch");
    }

    console.log("✅ DEBUG - Authentication verified, inserting message...");
    
    const insertData = {
      chat_session_id: chatId,
      input_message: message,
      user_id: userId,
      user_email: userEmail
    };

    console.log("🔍 DEBUG - Attempting to insert:", insertData);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error saving message:", {
        error: error,
        errorMessage: error.message,
        errorCode: error.code,
        details: error.details,
        hint: error.hint,
        insertData: insertData
      });
      throw error;
    }

    console.log("✅ Message saved successfully:", {
      savedData: data,
      timestamp: new Date().toISOString()
    });
    return data;
  } catch (error: any) {
    console.error("❌ Detailed error in saveMessage:", {
      error: error,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
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

    console.log("✅ Fetching messages...");
    
    const { data, error } = await supabase
      .from('chat_messages')
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
