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
      .single();

    // Update expired plans
    if (!activePlan && !planError) {
      await supabaseClient
        .from('user_plans')
        .update({ status: 'expired' })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lt('end_time', new Date().toISOString());

      // Use upsert instead of insert for daily usage record
      const currentDate = new Date().toISOString().split('T')[0];
      const { error: usageUpsertError } = await supabaseClient
        .from('user_daily_usage')
        .upsert({
          user_id: user.id,
          date: currentDate,
          responses_count: 0,
          output_tokens_used: 0,
          input_tokens_used: 0,
          last_usage_time: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        });

      if (usageUpsertError) {
        console.error('Error upserting daily usage:', usageUpsertError);
        throw usageUpsertError;
      }
    }

    // If no active paid plan, proceed with free plan checks
    if (!activePlan) {
      const currentDate = new Date().toISOString().split('T')[0];
      const { data: dailyUsage, error: usageError } = await supabaseClient
        .from('user_daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', currentDate)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }

      // Free tier limits
      const maxResponses = 7;
      const baseMaxOutputTokens = 400;
      const absoluteMaxOutputTokens = 800;

      if (dailyUsage) {
        // Check response count
        if (dailyUsage.responses_count >= maxResponses) {
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

        // Check token limits
        if (dailyUsage.output_tokens_used >= absoluteMaxOutputTokens) {
          return new Response(
            JSON.stringify({ 
              error: 'Token limit exceeded',
              limitReached: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 429
            }
          );
        }
      }

      // Update usage count before processing
      const { error: updateError } = await supabaseClient
        .from('user_daily_usage')
        .upsert({
          user_id: user.id,
          date: currentDate,
          responses_count: (dailyUsage?.responses_count || 0) + 1,
          output_tokens_used: dailyUsage?.output_tokens_used || 0,
          input_tokens_used: dailyUsage?.input_tokens_used || 0,
          last_usage_time: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }
    }

    // OpenAI Stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    fetch('https://api.openai.com/v1/chat/completions', {
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
        temperature: 0.7,
        stream: true,
      }),
    }).then(async (response) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No ReadableStream available');
      }

      let partialLine = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = new TextDecoder().decode(value);
          partialLine += chunk;

          let completeLines;
          if (partialLine.includes('\n')) {
            completeLines = partialLine.split('\n');
            partialLine = completeLines.pop() || '';
          } else {
            continue;
          }

          for (const line of completeLines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') {
                break;
              }

              try {
                const json = JSON.parse(data);
                const text = json.choices[0].delta.content;

                if (text) {
                  const queue = encoder.encode(JSON.stringify({ content: text }));
                  writer.write(queue);
                }
              } catch (e) {
                console.error('Error parsing JSON data:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error reading stream:', e);
        await writer.abort(e);
      } finally {
        console.log('Stream finished.');
        await writer.close();
        reader.releaseLock();
      }
    });

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

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
