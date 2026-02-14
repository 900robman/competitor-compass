import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InterviewSession, InterviewMessage, ClientResponse } from '@/types/interview';

export function useInterviewSessions(projectId: string) {
  return useQuery({
    queryKey: ['interview-sessions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InterviewSession[];
    },
    enabled: !!projectId,
  });
}

export function useCreateInterviewSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const sessionToken = `interview-${crypto.randomUUID()}`;
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          project_id: projectId,
          session_token: sessionToken,
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data as InterviewSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interview-sessions', data.project_id] });
    },
  });
}

export function useInterviewMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['interview-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_messages')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as InterviewMessage[];
    },
    enabled: !!sessionId,
  });
}

export function useClientResponses(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['client-responses', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_responses')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ClientResponse[];
    },
    enabled: !!sessionId,
  });
}
