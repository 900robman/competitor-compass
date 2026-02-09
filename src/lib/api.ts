import { supabase } from '@/integrations/supabase/client';
import { Project, Competitor, CrawlJob, CompetitorPage, CompetitorInsight } from '@/types/database';

// Projects
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProject(name: string, description: string, userId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: { name?: string; description?: string }): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Competitors
export async function getCompetitors(projectId: string): Promise<Competitor[]> {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCompetitor(id: string): Promise<Competitor | null> {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCompetitor(
  projectId: string,
  name: string,
  url: string
): Promise<Competitor> {
  const { data, error } = await supabase
    .from('competitors')
    .insert({ project_id: projectId, name, main_url: url })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompetitor(
  id: string,
  updates: { name?: string; main_url?: string; crawl_config?: any; active_crawl_job_id?: string | null }
): Promise<Competitor> {
  const { data, error } = await supabase
    .from('competitors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCompetitor(id: string): Promise<void> {
  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Crawl Jobs
export async function getCrawlJobs(competitorId: string): Promise<CrawlJob[]> {
  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAllCrawlJobs(): Promise<(CrawlJob & { competitor_name?: string })[]> {
  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*, competitors(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((job: any) => ({
    ...job,
    competitor_name: job.competitors?.name ?? 'Unknown',
    competitors: undefined,
  }));
}

export async function getCrawlJob(id: string): Promise<CrawlJob | null> {
  const { data, error } = await supabase
    .from('crawl_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Competitor Pages
export async function getCompetitorPages(competitorId: string): Promise<CompetitorPage[]> {
  const { data, error } = await supabase
    .from('competitor_pages')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Competitor Pages by project (all competitors)
export async function getProjectPages(projectId: string): Promise<(CompetitorPage & { competitor_name?: string })[]> {
  const { data, error } = await supabase
    .from('competitor_pages')
    .select('*, competitors!inner(name, project_id)')
    .eq('competitors.project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    competitor_name: p.competitors?.name ?? 'Unknown',
    competitors: undefined,
  }));
}

// Competitor Insights
export async function getCompetitorInsights(competitorId: string): Promise<CompetitorInsight[]> {
  const { data, error } = await supabase
    .from('competitor_insights')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Stats
export async function getProjectStats(): Promise<{ totalProjects: number; totalCompetitors: number; pendingCrawls: number }> {
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  const { count: competitorCount } = await supabase
    .from('competitors')
    .select('*', { count: 'exact', head: true });

  const { count: pendingCrawls } = await supabase
    .from('crawl_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return {
    totalProjects: projectCount ?? 0,
    totalCompetitors: competitorCount ?? 0,
    pendingCrawls: pendingCrawls ?? 0,
  };
}

export async function getCompetitorCount(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('competitors')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) throw error;
  return count ?? 0;
}
