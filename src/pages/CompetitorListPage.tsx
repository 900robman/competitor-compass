import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { StatusBadge } from '@/components/competitors/StatusBadge';
import { CompanyTypeBadge } from '@/components/competitors/CompanyTypeBadge';
import { PriorityBadge } from '@/components/competitors/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { useCompetitors, useCreateCompetitor, useDeleteCompetitor } from '@/hooks/useCompetitors';
import { toast } from 'sonner';
import { Plus, Loader2, ExternalLink, Trash2, Globe, Building2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Competitor, CompanyType, MonitoringPriority } from '@/types/database';

function isProjectSiteCompetitor(competitor: Competitor): boolean {
  const config = competitor.crawl_config as any;
  return config?.is_project_site === true;
}

export default function CompetitorListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitors, isLoading } = useCompetitors(projectId!);
  const createCompetitor = useCreateCompetitor();
  const deleteCompetitor = useDeleteCompetitor();
  const updateProject = useUpdateProject();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('http://');
  const [companyType, setCompanyType] = useState<CompanyType>('direct_competitor');
  const [priority, setPriority] = useState<MonitoringPriority>('medium');
  const [notes, setNotes] = useState('');
  const urlInputRef = React.useRef<HTMLInputElement>(null);

  // Filter state
  const [filterType, setFilterType] = useState<CompanyType | 'all'>('all');

  // Website editing state
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [websiteValue, setWebsiteValue] = useState('');
  const websiteInputRef = React.useRef<HTMLInputElement>(null);

  // Separate project site competitor from regular competitors
  const projectSiteCompetitor = competitors?.find(isProjectSiteCompetitor) ?? null;
  const regularCompetitors = competitors?.filter((c) => !isProjectSiteCompetitor(c)) ?? [];
  const filteredCompetitors = filterType === 'all'
    ? regularCompetitors
    : regularCompetitors.filter((c) => c.company_type === filterType);

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

  const handleCreateCompetitor = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createCompetitor.mutateAsync({
        projectId: projectId!,
        name: name.trim(),
        url: url.trim(),
        companyType,
        priority,
        notes: notes.trim() || undefined,
      });
      toast.success('Competitor added successfully');
      setDialogOpen(false);
      setName('');
      setUrl('http://');
      setCompanyType('direct_competitor');
      setPriority('medium');
      setNotes('');
    } catch (error) {
      toast.error('Failed to add competitor');
    }
  };

  const handleDeleteCompetitor = async () => {
    if (!competitorToDelete) return;

    try {
      await deleteCompetitor.mutateAsync({ id: competitorToDelete, projectId: projectId! });
      toast.success('Competitor deleted');
      setDeleteDialogOpen(false);
      setCompetitorToDelete(null);
    } catch (error) {
      toast.error('Failed to delete competitor');
    }
  };

  const handleSaveWebsite = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId!,
        updates: { website: websiteValue.trim() || null },
      });
      toast.success('Website updated');
      setEditingWebsite(false);
    } catch (error) {
      toast.error('Failed to update website');
    }
  };

  return (
    <DashboardLayout projectName={project?.name}>
      <Header
        title="Competitors"
        subtitle={project ? `Tracking competitors for ${project.name}` : undefined}
      />

      <div className="p-6">
        {/* Project Website Section */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Your Website</p>
              {editingWebsite ? (
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    ref={websiteInputRef}
                    className="h-8 max-w-xs text-sm"
                    value={websiteValue}
                    onChange={(e) => setWebsiteValue(e.target.value)}
                    placeholder="https://yoursite.com"
                    onFocus={() => {
                      setTimeout(() => {
                        if (websiteInputRef.current) {
                          const len = websiteInputRef.current.value.length;
                          websiteInputRef.current.setSelectionRange(len, len);
                        }
                      }, 0);
                    }}
                  />
                  <Button size="sm" variant="default" onClick={handleSaveWebsite} disabled={updateProject.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingWebsite(false)}>
                    Cancel
                  </Button>
                </div>
              ) : project?.website ? (
                <div className="flex items-center gap-2">
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {project.website}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => {
                      setWebsiteValue(project.website ?? '');
                      setEditingWebsite(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0 text-sm text-muted-foreground"
                  onClick={() => {
                    setWebsiteValue('http://');
                    setEditingWebsite(true);
                  }}
                >
                  + Add your website URL to map &amp; scrape your own pages
                </Button>
              )}
            </div>
            {projectSiteCompetitor && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/project/${projectId}/competitor/${projectSiteCompetitor.id}`)}
              >
                View Pages
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Competitors Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {regularCompetitors.length} Competitor{regularCompetitors.length !== 1 ? 's' : ''}
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Competitor</DialogTitle>
                <DialogDescription>
                  Add a new competitor to track. The n8n workflow will scrape their website.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="comp-name">Competitor Name</Label>
                  <Input
                    id="comp-name"
                    placeholder="e.g., Acme Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-url">Website URL</Label>
                  <Input
                    id="comp-url"
                    ref={urlInputRef}
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => {
                      setTimeout(() => {
                        if (urlInputRef.current) {
                          const len = urlInputRef.current.value.length;
                          urlInputRef.current.setSelectionRange(len, len);
                        }
                      }, 0);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Type</Label>
                    <Select value={companyType} onValueChange={(v) => setCompanyType(v as CompanyType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct_competitor">Direct Competitor</SelectItem>
                        <SelectItem value="indirect_competitor">Indirect Competitor</SelectItem>
                        <SelectItem value="geographic_competitor">Geographic</SelectItem>
                        <SelectItem value="aspirational">Aspirational</SelectItem>
                        <SelectItem value="market_leader">Market Leader</SelectItem>
                        <SelectItem value="emerging_threat">Emerging Threat</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monitoring Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as MonitoringPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes about this company (e.g., why you're tracking them)..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCompetitor} disabled={createCompetitor.isPending}>
                  {createCompetitor.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Competitor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-4">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as CompanyType | 'all')}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Company Types</SelectItem>
              <SelectItem value="direct_competitor">Direct Competitors</SelectItem>
              <SelectItem value="indirect_competitor">Indirect Competitors</SelectItem>
              <SelectItem value="geographic_competitor">Geographic</SelectItem>
              <SelectItem value="aspirational">Aspirational</SelectItem>
              <SelectItem value="market_leader">Market Leaders</SelectItem>
              <SelectItem value="emerging_threat">Emerging Threats</SelectItem>
              <SelectItem value="partner">Partners</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Competitors Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCompetitors.length > 0 ? (
          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Crawled</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TooltipProvider>
                  {filteredCompetitors.map((competitor) => (
                    <TableRow
                      key={competitor.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/project/${projectId}/competitor/${competitor.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {competitor.name}
                          {competitor.relationship_notes && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{competitor.relationship_notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {competitor.main_url ? (
                          <a
                            href={competitor.main_url.startsWith('http') ? competitor.main_url : `https://${competitor.main_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            {(() => { try { return new URL(competitor.main_url.startsWith('http') ? competitor.main_url : `https://${competitor.main_url}`).hostname; } catch { return competitor.main_url; } })()}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No URL</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <CompanyTypeBadge type={competitor.company_type} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={competitor.monitoring_priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={competitor.last_crawled_at ? 'Active' : 'Pending'} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {competitor.last_crawled_at
                          ? format(new Date(competitor.last_crawled_at), 'MMM d, yyyy HH:mm')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompetitorToDelete(competitor.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TooltipProvider>
              </TableBody>
            </Table>
          </Card>
        ) : regularCompetitors.length > 0 && filterType !== 'all' ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No competitors match this filter.</p>
              <Button variant="link" className="mt-2" onClick={() => setFilterType('all')}>
                Clear filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No competitors yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first competitor to start tracking.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Competitor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this competitor and all associated insights. This action
              cannot be undone.
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
