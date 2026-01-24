import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompetitors,
  getCompetitor,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorInsights,
  getCompetitorCount,
} from '@/lib/api';

export function useCompetitors(projectId: string) {
  return useQuery({
    queryKey: ['competitors', projectId],
    queryFn: () => getCompetitors(projectId),
    enabled: !!projectId,
  });
}

export function useCompetitor(id: string) {
  return useQuery({
    queryKey: ['competitor', id],
    queryFn: () => getCompetitor(id),
    enabled: !!id,
  });
}

export function useCompetitorCount(projectId: string) {
  return useQuery({
    queryKey: ['competitorCount', projectId],
    queryFn: () => getCompetitorCount(projectId),
    enabled: !!projectId,
  });
}

export function useCompetitorInsights(competitorId: string) {
  return useQuery({
    queryKey: ['competitorInsights', competitorId],
    queryFn: () => getCompetitorInsights(competitorId),
    enabled: !!competitorId,
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      name,
      mainUrl,
    }: {
      projectId: string;
      name: string;
      mainUrl: string;
    }) => createCompetitor(projectId, name, mainUrl),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
      queryClient.invalidateQueries({ queryKey: ['competitorCount', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: { name?: string; main_url?: string; status?: string };
    }) => updateCompetitor(id, updates),
    onSuccess: (_, { id, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
      queryClient.invalidateQueries({ queryKey: ['competitor', id] });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) => deleteCompetitor(id),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', projectId] });
      queryClient.invalidateQueries({ queryKey: ['competitorCount', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectStats'] });
    },
  });
}
