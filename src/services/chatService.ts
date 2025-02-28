import { supabase } from "@/integrations/supabase/client";

export async function createChat() {
  try {
    console.log("[createChat] Starting...");
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error("[createChat] Session error or no user:", {
        error: sessionError,
        hasSession: !!session,
        hasUser: session?.user ? true : false
      });
      return { error: "Authentication error", data: null };
    }

    const user = session.user;
    
    console.log("[createChat] Creating chat for user:", {
      userId: user.id,
      userEmail: user.email
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
      console.error("[createChat] Error:", insertError);
      return { error: insertError.message, data: null };
    }

    console.log("[createChat] Success:", data);
    return { error: null, data };
  } catch (error: any) {
    console.error("[createChat] Unexpected error:", error);
    return { error: error.message, data: null };
  }
}

export async function saveMessage(chatId: string, message: string, userId: string, userEmail: string) {
  console.log("[saveMessage] Starting with params:", {
    chatId,
    messageLength: message.length,
    userId,
    userEmail,
    timestamp: new Date().toISOString()
  });

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error("[saveMessage] Auth error:", {
        error: sessionError,
        hasSession: !!session,
        hasUser: !!session?.user,
        timestamp: new Date().toISOString()
      });
      throw new Error("Authentication required");
    }

    console.log("[saveMessage] Session verified for user:", {
      sessionUserId: session.user.id,
      providedUserId: userId,
      doTheyMatch: session.user.id === userId
    });

    // First, save the user's message
    const { data: savedUserMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        chat_session_id: chatId,
        content: message,
        user_id: userId,
        sender: 'user'
      })
      .select()
      .maybeSingle();

    if (userMessageError) {
      console.error("[saveMessage] User message insert error:", {
        error: userMessageError,
        errorMessage: userMessageError.message,
        errorDetails: userMessageError.details,
        timestamp: new Date().toISOString()
      });
      throw userMessageError;
    }

    console.log("[saveMessage] User message saved successfully:", {
      savedMessageId: savedUserMessage?.id,
      timestamp: new Date().toISOString()
    });

    // Now call process-message to get AI response
    console.log("[saveMessage] Calling process-message for AI response");
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('process-message', {
      body: {
        content: message,
        chat_session_id: chatId
      }
    });

    if (aiError) {
      console.error("[saveMessage] AI response error:", {
        error: aiError,
        timestamp: new Date().toISOString()
      });
      throw aiError;
    }

    // Save the AI response as a new message
    if (aiResponse?.content) {
      console.log("[saveMessage] Saving AI response");
      const { error: aiMessageError } = await supabase
        .from('messages')
        .insert({
          chat_session_id: chatId,
          content: aiResponse.content,
          user_id: userId,
          sender: 'ai'
        });

      if (aiMessageError) {
        console.error("[saveMessage] AI message insert error:", {
          error: aiMessageError,
          timestamp: new Date().toISOString()
        });
        throw aiMessageError;
      }

      console.log("[saveMessage] AI response saved successfully");
    }

    return savedUserMessage;
  } catch (error) {
    console.error("[saveMessage] Caught error:", {
      error,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function fetchMessages(chatId: string) {
  console.log("[fetchMessages] Starting for chat:", chatId);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("[fetchMessages] No session");
      return [];
    }

    console.log("[fetchMessages] Fetching messages...");

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("[fetchMessages] Error:", error);
      return [];
    }

    console.log("[fetchMessages] Success, found messages:", data?.length);
    return data || [];
  } catch (error) {
    console.error("[fetchMessages] Error:", error);
    return [];
  }
}

export async function fetchChats(userId: string) {
  console.log("[fetchChats] Starting for user:", userId);
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("[fetchChats] No session");
      return [];
    }

    console.log("[fetchChats] Fetching chats...");

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[fetchChats] Error:", error);
      return [];
    }

    console.log("[fetchChats] Success, found chats:", data?.length);
    return data || [];
  } catch (error) {
    console.error("[fetchChats] Error:", error);
    return [];
  }
}
