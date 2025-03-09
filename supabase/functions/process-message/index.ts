
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
      
      // First get the current daily usage
      const { data: currentUsage, error: currentUsageError } = await supabaseClient
        .from('user_daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', currentDate)
        .maybeSingle();

      if (currentUsageError) {
        console.error('Error fetching current usage:', currentUsageError);
        throw currentUsageError;
      }

      // If no usage record exists, create one
      if (!currentUsage) {
        const { data: newUsage, error: insertError } = await supabaseClient
          .from('user_daily_usage')
          .insert({
            user_id: user.id,
            date: currentDate,
            responses_count: 1,  // Start with 1 for first message
            output_tokens_used: 0,
            input_tokens_used: 0,
            last_usage_time: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating usage record:', insertError);
          throw insertError;
        }

        // Use the new usage record for further checks
        currentUsage = newUsage;
      } else {
        // Increment the existing usage count
        const { data: updatedUsage, error: updateError } = await supabaseClient
          .from('user_daily_usage')
          .update({ 
            responses_count: (currentUsage.responses_count || 0) + 1,
            last_usage_time: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('date', currentDate)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating usage:', updateError);
          throw updateError;
        }

        // Check limits using the updated count
        const maxResponses = 7;
        if (updatedUsage.responses_count > maxResponses) {
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
      }
    }

    // OpenAI Request with non-streaming
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
