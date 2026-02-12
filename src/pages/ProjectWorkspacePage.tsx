import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProject } from '@/hooks/useProjects';
import { useCompetitors, useCreateCompetitor, useDeleteCompetitor } from '@/hooks/useCompetitors';
import { toast } from 'sonner';
import { Plus, Loader2, Globe, Search } from 'lucide-react';
import { Competitor, CompanyType } from '@/types/database';
import { CompanyTypeSelect } from '@/components/competitors/CompanyTypeSelect';
import { YourWebsiteCard } from '@/components/workspace/YourWebsiteCard';
import { WorkspaceStatsCards } from '@/components/workspace/WorkspaceStatsCards';
import { CompetitorsTable } from '@/components/workspace/CompetitorsTable';
import { AddCompanyDialog } from '@/components/workspace/AddCompanyDialog';

function isProjectSiteCompetitor(competitor: Competitor): boolean {
  const config = competitor.crawl_config as any;
  return config?.is_project_site === true;
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitors, isLoading } = useCompetitors(projectId!);
  const createCompetitor = useCreateCompetitor();
  const deleteCompetitor = useDeleteCompetitor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CompanyType | 'all'>('all');

  // Separate project site from regular competitors
  const projectSiteCompetitor = competitors?.find(isProjectSiteCompetitor) ?? null;
  const regularCompetitors = useMemo(
    () => competitors?.filter((c) => !isProjectSiteCompetitor(c)) ?? [],
    [competitors]
  );

  // Filter and search
  const filteredCompetitors = useMemo(() => {
    let result = regularCompetitors;
    if (filterType !== 'all') {
      result = result.filter((c) => c.company_type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.main_url?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [regularCompetitors, filterType, searchQuery]);

  // Auto-create self-competitor when project has website but no self-competitor exists
  useEffect(() => {
    if (!project?.website || !competitors || projectSiteCompetitor) return;

    createCompetitor.mutate(
      {
        projectId: projectId!,
        name: `${project.name} (Your Site)`,
        url: project.website,
      },
      {
        onSuccess: async (created) => {
          const { supabase } = await import('@/integrations/supabase/client');
          await supabase
            .from('competitors')
            .update({ crawl_config: { is_project_site: true } })
            .eq('id', created.id);
        },
      }
    );
  }, [project?.website, competitors, projectSiteCompetitor]);

  const handleCreateCompetitor = async (data: {
    name: string;
    url: string;
    companyType: CompanyType;
    priority: 'high' | 'medium' | 'low';
    notes: string;
  }) => {
    if (!data.name.trim() || !data.url.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await createCompetitor.mutateAsync({
        projectId: projectId!,
        name: data.name.trim(),
        url: data.url.trim(),
        companyType: data.companyType,
        priority: data.priority,
        notes: data.notes.trim() || undefined,
      });
      toast.success('Company added successfully');
      setDialogOpen(false);
    } catch {
      toast.error('Failed to add company');
    }
  };

  const handleDeleteCompetitor = async () => {
    if (!competitorToDelete) return;
    try {
      await deleteCompetitor.mutateAsync({ id: competitorToDelete, projectId: projectId! });
      toast.success('Company deleted');
      setDeleteDialogOpen(false);
      setCompetitorToDelete(null);
    } catch {
      toast.error('Failed to delete company');
    }
  };

  return (
    <DashboardLayout projectName={project?.name}>
      <div className="flex h-full">
        {/* Left Sidebar — Your Website */}
        <aside className="w-64 shrink-0 border-r border-border p-4">
          <YourWebsiteCard
            project={project}
            projectId={projectId!}
            projectSiteCompetitor={projectSiteCompetitor}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {project?.name ?? 'Workspace'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search companies... ⌘K"
                    className="h-9 w-64 pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <WorkspaceStatsCards competitors={regularCompetitors} />

            {/* Tracked Companies Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Tracked Companies</h2>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <CompanyTypeSelect
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as CompanyType | 'all')}
                  includeAll
                  className="w-[200px]"
                />
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCompetitors.length > 0 ? (
                <Card className="border-border/50">
                  <CompetitorsTable
                    competitors={filteredCompetitors}
                    projectId={projectId!}
                    onDelete={(id) => {
                      setCompetitorToDelete(id);
                      setDeleteDialogOpen(true);
                    }}
                  />
                </Card>
              ) : regularCompetitors.length > 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">No companies match your filters.</p>
                    <Button variant="link" className="mt-2" onClick={() => { setFilterType('all'); setSearchQuery(''); }}>
                      Clear filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-foreground">No tracked companies yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Add your first company to start tracking.</p>
                    <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Company
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Company Dialog */}
      <AddCompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateCompetitor}
        isPending={createCompetitor.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tracked Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this company and all associated insights. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompetitor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
