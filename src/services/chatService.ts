import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function createChat() {
  try {
    console.log("[createChat] Starting...");
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session = sessionData?.session;

    // Try to refresh session if not found
    if (!session || sessionError) {
      console.log("[createChat] No session found, attempting refresh...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("[createChat] Session refresh failed:", refreshError);
        return { error: "Authentication error", data: null };
      }
      
      session = refreshData.session;
      console.log("[createChat] Session refreshed successfully");
    }

    if (!session?.user) {
      console.error("[createChat] No user in session");
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
    // Get current session and attempt refresh if needed
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session = sessionData?.session;

    if (!session || sessionError) {
      console.log("[saveMessage] No session found, attempting refresh...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("[saveMessage] Session refresh failed:", refreshError);
        throw new Error("Authentication required");
      }
      
      session = refreshData.session;
      console.log("[saveMessage] Session refreshed successfully");
    }

    // Check plan limits before sending message
    const response = await fetch(
      `https://ptpxhzfjfssaxilyuwzd.supabase.co/functions/v1/check-plan-limits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_tokens: Math.ceil(message.length / 4),
          output_tokens: 800
        })
      }
    );

    const planCheckData = await response.json();
    
    if (!response.ok) {
      console.error("[saveMessage] Plan limit check failed:", planCheckData);
      
      if (planCheckData.planExpired) {
        // Use toast to show expiry message
        toast({
          title: "Plan Expired",
          description: "Your plan has expired. Please upgrade to continue using Serona AI.",
          variant: "destructive",
        });
        return { error: planCheckData.error, planExpired: true };
      }
      
      throw new Error(planCheckData.error || "Plan limit reached");
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
      console.error("[saveMessage] User message insert error:", userMessageError);
      throw userMessageError;
    }

    // Call the edge function with non-streaming response
    const aiResponse = await fetch(
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

    if (!aiResponse.ok) {
      throw new Error('Failed to get AI response');
    }

    const aiResponseData = await aiResponse.json();

    if (aiResponseData.error) {
      console.error("[saveMessage] AI response error:", aiResponseData);
      
      if (aiResponseData.limitReached) {
        return {
          userMessage,
          aiMessage: null,
          limitReached: true
        };
      }
      
      throw new Error(aiResponseData.error);
    }

    console.log("[saveMessage] Success - AI response received");

    return {
      userMessage,
      aiMessage: {
        id: Date.now().toString(),
        content: aiResponseData.content,
        sender: 'ai' as const
      },
      limitReached: false
    };

  } catch (error: any) {
    console.error("[saveMessage] Error:", {
      error,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

export async function fetchMessages(chatId: string) {
  console.log("[fetchMessages] Starting for chat:", chatId);
  
  try {
    // Get current session and attempt refresh if needed
    const { data: sessionData } = await supabase.auth.getSession();
    let session = sessionData?.session;

    if (!session) {
      console.log("[fetchMessages] No session found, attempting refresh...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("[fetchMessages] Session refresh failed:", refreshError);
        throw new Error("Authentication required");
      }
      
      session = refreshData.session;
      console.log("[fetchMessages] Session refreshed successfully");
    }

    console.log("[fetchMessages] Fetching messages...");

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_session_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("[fetchMessages] Error:", error);
      throw error;
    }

    console.log("[fetchMessages] Success, found messages:", data?.length);
    return data || [];
  } catch (error) {
    console.error("[fetchMessages] Error:", error);
    throw error;
  }
}

export async function fetchChats(userId: string) {
  console.log("[fetchChats] Starting for user:", userId);
  
  try {
    // Get current session and attempt refresh if needed
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("[fetchChats] No session found, attempting refresh...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error("[fetchChats] Session refresh failed");
        return [];
      }
      
      console.log("[fetchChats] Session refreshed successfully");
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
