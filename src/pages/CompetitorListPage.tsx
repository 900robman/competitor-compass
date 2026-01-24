import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { StatusBadge } from '@/components/competitors/StatusBadge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProject } from '@/hooks/useProjects';
import { useCompetitors, useCreateCompetitor, useDeleteCompetitor } from '@/hooks/useCompetitors';
import { toast } from 'sonner';
import { Plus, Loader2, ExternalLink, Trash2, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function CompetitorListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitors, isLoading } = useCompetitors(projectId!);
  const createCompetitor = useCreateCompetitor();
  const deleteCompetitor = useDeleteCompetitor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleCreateCompetitor = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createCompetitor.mutateAsync({
        projectId: projectId!,
        name: name.trim(),
        mainUrl: url.trim(),
      });
      toast.success('Competitor added successfully');
      setDialogOpen(false);
      setName('');
      setUrl('');
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

  return (
    <DashboardLayout projectName={project?.name}>
      <Header
        title="Competitors"
        subtitle={project ? `Tracking competitors for ${project.name}` : undefined}
      />

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {competitors?.length ?? 0} Competitor{(competitors?.length ?? 0) !== 1 ? 's' : ''}
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
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

        {/* Competitors Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : competitors && competitors.length > 0 ? (
          <Card className="border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Crawled</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
                  <TableRow
                    key={competitor.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/project/${projectId}/competitor/${competitor.id}`)}
                  >
                    <TableCell className="font-medium">{competitor.name}</TableCell>
                    <TableCell>
                      <a
                        href={competitor.main_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {new URL(competitor.main_url).hostname}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={competitor.status} />
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
              </TableBody>
            </Table>
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
