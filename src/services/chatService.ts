
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      toast({
        title: "Authentication Error",
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      throw new Error("Authentication required");
    }

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
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
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Error",
        description: "Failed to save your message. Please try again.",
        variant: "destructive",
      });
      throw userMessageError;
    }

    console.log("[saveMessage] User message saved successfully:", {
      messageId: userMessage?.id,
      timestamp: new Date().toISOString()
    });

    // Call the edge function with non-streaming response
    const response = await fetch(
      `https://ptpxhzfjfssaxilyuwzd.supabase.co/functions/v1/process-message`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message,
          chat_session_id: chatId
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[saveMessage] AI response error:", errorText);
      
      // Check if the error is due to free plan limit
      if (errorText.includes("Daily response limit exceeded for free plan")) {
        throw new Error("FREE_PLAN_LIMIT_EXCEEDED");
      }
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      throw new Error(errorText);
    }

    const aiResponseData = await response.json();
    return {
      userMessage,
      aiMessage: {
        id: Date.now().toString(),
        content: aiResponseData.content,
        sender: 'ai' as const
      }
    };

  } catch (error: any) {
    console.error("[saveMessage] Caught error:", {
      error,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    // If it's a free plan limit error, propagate it
    if (error.message === "FREE_PLAN_LIMIT_EXCEEDED") {
      throw error;
    }
    
    // Only show toast if one hasn't been shown for this error already
    if (!error.message.includes("timeout")) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
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
