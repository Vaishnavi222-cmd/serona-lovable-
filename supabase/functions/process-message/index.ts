import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { content, chat_session_id } = await req.json();

    // Enhanced check for active paid plan with automatic expiration handling
    const { data: activePlan, error: planError } = await supabaseClient
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('end_time', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Update expired plans
    if (!activePlan && !planError) {
      await supabaseClient
        .from('user_plans')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lt('end_time', new Date().toISOString());
    }

    // If no active paid plan, proceed with free plan checks
    if (!activePlan) {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get current usage record for today
      const { data: currentUsage, error: usageError } = await supabaseClient
        .from('user_daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', currentDate)
        .single();

      if (usageError && usageError.code !== 'PGRST116') { // Not found error
        console.error('Error checking usage:', usageError);
        throw usageError;
      }

      // Calculate new response count
      const newCount = currentUsage ? currentUsage.responses_count + 1 : 1;
      
      // Check limit before making any updates
      if (newCount > 7) {
        return new Response(
          JSON.stringify({ 
            error: 'Daily response limit exceeded',
            limitReached: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429
          }
        );
      }

      // Update or create usage record
      const { error: updateError } = await supabaseClient
        .from('user_daily_usage')
        .upsert({
          user_id: user.id,
          date: currentDate,
          responses_count: newCount,
          last_usage_time: new Date().toISOString(),
          ...(currentUsage ? {} : { output_tokens_used: 0, input_tokens_used: 0 })
        }, {
          onConflict: 'user_id,date'
        });

      if (updateError) {
        console.error('Error updating usage:', updateError);
        throw updateError;
      }
    }

    // OpenAI Request (keeping existing implementation)
    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are Serona AI, a personal AI companion for growth and guidance. You provide personalized support for deep personality analysis, career guidance, and more. You are designed to understand the user and guide them forward. You are friendly, helpful, and encouraging. You are not a therapist, so do not give therapy advice. You are not a financial advisor, so do not give financial advice. You are not a doctor, so do not give medical advice. You are not a lawyer, so do not give legal advice. You are not a substitute for professional help.`,
            },
            { role: 'user', content: content },
          ],
          stream: false,
          max_tokens: 800,
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const responseData = await openAIResponse.json();
      const aiResponse = responseData.choices[0].message.content;

      // Save AI message to database
      const { error: messageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_session_id: chat_session_id,
          content: aiResponse,
          user_id: user.id,
          sender: 'ai'
        });

      if (messageError) {
        console.error('Error saving AI message:', messageError);
        throw messageError;
      }

      return new Response(
        JSON.stringify({ content: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('OpenAI error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
