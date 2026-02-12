import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { CompanyTypesManager } from '@/components/settings/CompanyTypesManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Bell, Users, Plug } from 'lucide-react';

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({ id: projectId!, updates: { name, description } });
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId!);
      toast.success('Project deleted');
      navigate('/');
    } catch { toast.error('Failed to delete'); }
  };

  if (!project) return null;

  return (
    <DashboardLayout projectName={project.name}>
      <Header title="Settings" subtitle="Manage your project settings" />
      <div className="max-w-2xl space-y-6 p-6">
        <Card>
          <CardHeader><CardTitle>General</CardTitle><CardDescription>Update project details</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <Button onClick={handleSave} disabled={updateProject.isPending}>{updateProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </CardContent>
        </Card>

        {/* Company Types Management */}
        <CompanyTypesManager />

        <Card className="opacity-60">
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications<span className="rounded bg-muted px-2 py-0.5 text-xs">Coming Soon</span></CardTitle></CardHeader>
        </Card>
        <Card className="opacity-60">
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team<span className="rounded bg-muted px-2 py-0.5 text-xs">Coming Soon</span></CardTitle></CardHeader>
        </Card>
        <Card className="opacity-60">
          <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="h-5 w-5" />Integrations<span className="rounded bg-muted px-2 py-0.5 text-xs">Coming Soon</span></CardTitle></CardHeader>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle><CardDescription>Permanently delete this project</CardDescription></CardHeader>
          <CardContent><Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>Delete Project</Button></CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Project?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the project and all data.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
