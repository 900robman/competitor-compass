import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompetitors,
  getCompetitor,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
  getCompetitorInsights,
  getCompetitorPages,
  getCompetitorCount,
  getCrawlJobs,
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

export function useCompetitorPages(competitorId: string) {
  return useQuery({
    queryKey: ['competitorPages', competitorId],
    queryFn: () => getCompetitorPages(competitorId),
    enabled: !!competitorId,
  });
}

export function useCompetitorInsights(competitorId: string) {
  return useQuery({
    queryKey: ['competitorInsights', competitorId],
    queryFn: () => getCompetitorInsights(competitorId),
    enabled: !!competitorId,
  });
}

export function useCrawlJobs(competitorId: string) {
  return useQuery({
    queryKey: ['crawlJobs', competitorId],
    queryFn: () => getCrawlJobs(competitorId),
    enabled: !!competitorId,
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      name,
      url,
    }: {
      projectId: string;
      name: string;
      url: string;
    }) => createCompetitor(projectId, name, url),
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
      updates: { name?: string; main_url?: string; crawl_config?: any; active_crawl_job_id?: string | null };
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
