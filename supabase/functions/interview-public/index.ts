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

    // Validate session_token format (basic input validation)
    if (!session_token || typeof session_token !== 'string' || session_token.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: get_session
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

    // Action: get_messages
    if (action === 'get_messages') {
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

    // Action: send_message
    if (action === 'send_message') {
      // Validate message input
      if (!message || typeof message !== 'string' || message.length > 10000) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const n8nUrl = Deno.env.get('N8N_INTERVIEW_URL') || 'https://n8n.offshoot.co.nz/webhook/redesign/interview-chat';

      const res = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token, message }),
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
          JSON.stringify({ success: false, error: 'Failed to process message' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
