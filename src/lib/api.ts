import { supabase } from '@/integrations/supabase/client';
import { Project, Competitor, CompetitorInsight } from '@/types/database';

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
    .single();

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
    .single();

  if (error) throw error;
  return data;
}

export async function createCompetitor(
  projectId: string,
  name: string,
  mainUrl: string
): Promise<Competitor> {
  const { data, error } = await supabase
    .from('competitors')
    .insert({ project_id: projectId, name, main_url: mainUrl, status: 'Pending' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompetitor(
  id: string,
  updates: { name?: string; main_url?: string; status?: string }
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

  const { data: competitors } = await supabase
    .from('competitors')
    .select('status');

  const totalCompetitors = competitors?.length ?? 0;
  const pendingCrawls = competitors?.filter(c => c.status === 'Pending').length ?? 0;

  return {
    totalProjects: projectCount ?? 0,
    totalCompetitors,
    pendingCrawls,
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
