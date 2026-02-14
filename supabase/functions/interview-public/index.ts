import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { action, session_token, message } = await req.json();

    // Action: get_session – load session + project name by token
    if (action === 'get_session') {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('*, projects(name)')
        .eq('session_token', session_token)
        .single();

      if (error || !session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: get_messages – fetch chat history for a session
    if (action === 'get_messages') {
      // First resolve session id from token
      const { data: session } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('session_token', session_token)
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ success: false, error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: messages, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: messages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: send_message – forward to n8n and return
    if (action === 'send_message') {
      const n8nUrl = 'https://n8n.offshoot.co.nz/webhook/redesign/interview-chat';

      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token,
          message,
        }),
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (!res.ok) {
        console.error('n8n error:', res.status, responseText);
        return new Response(
          JSON.stringify({ success: false, error: `Webhook returned ${res.status}`, details: responseData }),
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: responseData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
