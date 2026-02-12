import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout';
import { StatusBadge } from '@/components/competitors/StatusBadge';
import { CompanyTypeBadge } from '@/components/competitors/CompanyTypeBadge';
import { CompanyTypeSelect } from '@/components/competitors/CompanyTypeSelect';
import { PriorityBadge } from '@/components/competitors/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/hooks/useProjects';
import { useCompetitor, useCompetitorPages, useCrawlJobs, useUpdateCompetitor } from '@/hooks/useCompetitors';
import { ArrowLeft, ExternalLink, Loader2, Pencil, Check, X } from 'lucide-react';
import { CompanyType, MonitoringPriority, Competitor } from '@/types/database';
import { toast } from 'sonner';
import { OverviewTab } from '@/components/detail/OverviewTab';
import { ContentTab } from '@/components/detail/ContentTab';
import { HistoryTab } from '@/components/detail/HistoryTab';
import { InsightsTab } from '@/components/detail/InsightsTab';

function isProjectSiteCompetitor(competitor: Competitor): boolean {
  const config = competitor.crawl_config as any;
  return config?.is_project_site === true;
}

export default function CompetitorDetailPage() {
  const { projectId, competitorId } = useParams<{ projectId: string; competitorId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitor, isLoading: competitorLoading } = useCompetitor(competitorId!);
  const { data: pages = [], isLoading: pagesLoading } = useCompetitorPages(competitorId!);
  const { data: crawlJobs = [], isLoading: jobsLoading } = useCrawlJobs(competitorId!);
  const updateCompetitor = useUpdateCompetitor();

  const [editing, setEditing] = useState(false);
  const [editType, setEditType] = useState<CompanyType>('direct_competitor');
  const [editPriority, setEditPriority] = useState<MonitoringPriority>('medium');
  const [editNotes, setEditNotes] = useState('');

  const startEditing = () => {
    if (!competitor) return;
    setEditType(competitor.company_type ?? 'direct_competitor');
    setEditPriority(competitor.monitoring_priority ?? 'medium');
    setEditNotes(competitor.relationship_notes ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!competitor) return;
    try {
      await updateCompetitor.mutateAsync({
        id: competitor.id,
        projectId: competitor.project_id,
        updates: {
          company_type: editType,
          monitoring_priority: editPriority,
          relationship_notes: editNotes.trim() || null,
        },
      });
      toast.success('Company details updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update');
    }
  };

  if (competitorLoading) {
    return (
      <DashboardLayout projectName={project?.name}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!competitor) {
    return (
      <DashboardLayout projectName={project?.name}>
        <div className="flex h-full flex-col items-center justify-center">
          <p className="text-muted-foreground">Company not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/project/${projectId}`)}>
            Back to Tracked Companies
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectName={project?.name}>
      <div className="p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate(`/project/${projectId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tracked Companies
        </Button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{competitor.name}</h1>
              <StatusBadge status={competitor.last_crawled_at ? 'Active' : 'Pending'} />
            </div>
            <a
              href={competitor.main_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {competitor.main_url}
              <ExternalLink className="h-3 w-3" />
            </a>
            {!editing && !isProjectSiteCompetitor(competitor) && (
              <div className="flex items-center gap-2 pt-1">
                <CompanyTypeBadge type={competitor.company_type} />
                <PriorityBadge priority={competitor.monitoring_priority} />
              </div>
            )}
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit Company
            </Button>
          )}
        </div>

        {/* Inline edit form */}
        {editing && (
          <div className="mb-6 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Type</Label>
                <CompanyTypeSelect value={editType} onValueChange={(v) => setEditType(v as CompanyType)} />
              </div>
              <div className="space-y-2">
                <Label>Monitoring Priority</Label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as MonitoringPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes about this company..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateCompetitor.isPending}>
                {updateCompetitor.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <ContentTab pages={pages} isLoading={pagesLoading} />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              pages={pages}
              crawlJobs={crawlJobs}
              lastCrawledAt={competitor.last_crawled_at}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryTab jobs={crawlJobs} isLoading={jobsLoading} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsTab competitorName={competitor.name} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
