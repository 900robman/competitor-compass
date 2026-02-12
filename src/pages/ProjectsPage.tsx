import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects, useProjectStats, useCreateProject } from '@/hooks/useProjects';
import { useCompetitorCount } from '@/hooks/useCompetitors';
import { toast } from 'sonner';
import { FolderOpen, Users, Clock, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function ProjectCard({ project }: { project: { id: string; name: string; description: string | null; created_at: string } }) {
  const navigate = useNavigate();
  const { data: competitorCount = 0 } = useCompetitorCount(project.id);

  return (
    <Card
      className="cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-primary/10 p-2">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {competitorCount} tracked compan{competitorCount !== 1 ? 'ies' : 'y'}
          </span>
        </div>
        <CardTitle className="mt-3 text-lg">{project.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">
          Created {format(new Date(project.created_at), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: stats } = useProjectStats();
  const createProject = useCreateProject();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('https://');
  const websiteInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateProject = async () => {
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const project = await createProject.mutateAsync({ name: name.trim(), description: description.trim(), website: website.trim() === 'https://' ? undefined : website.trim() });
      toast.success('Project created successfully');
      setDialogOpen(false);
      setName('');
      setDescription('');
      setWebsite('https://');
      navigate(`/project/${project.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  return (
    <DashboardLayout>
      <Header title="Projects" subtitle="Manage your competitor intelligence projects" />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total Projects"
            value={stats?.totalProjects ?? 0}
            icon={<FolderOpen className="h-5 w-5" />}
          />
          <StatsCard
            title="Tracked Companies"
            value={stats?.totalCompetitors ?? 0}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title="Pending Crawls"
            value={stats?.pendingCrawls ?? 0}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        {/* Projects Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to organize your company tracking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., SaaS Competitors Q1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this project tracking?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL (optional)</Label>
                  <Input
                    id="website"
                    ref={websiteInputRef}
                    placeholder="https://yoursite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    onFocus={() => {
                      setTimeout(() => {
                        if (websiteInputRef.current) {
                          const len = websiteInputRef.current.value.length;
                          websiteInputRef.current.setSelectionRange(len, len);
                        }
                      }, 0);
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={createProject.isPending}>
                  {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No projects yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first project to start tracking companies.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
