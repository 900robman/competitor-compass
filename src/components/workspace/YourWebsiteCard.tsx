import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Competitor, Project } from '@/types/database';
import { useUpdateProject } from '@/hooks/useProjects';
import { toast } from 'sonner';

interface YourWebsiteCardProps {
  project: Project | undefined;
  projectId: string;
  projectSiteCompetitor: Competitor | null;
}

export function YourWebsiteCard({ project, projectId, projectSiteCompetitor }: YourWebsiteCardProps) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const [editing, setEditing] = useState(false);
  const [websiteValue, setWebsiteValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { website: websiteValue.trim() || null },
      });
      toast.success('Website updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update website');
    }
  };

  return (
    <div className="sticky top-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Your Website
      </h3>
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            {projectSiteCompetitor && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs text-primary"
                onClick={() => navigate(`/project/${projectId}/competitor/${projectSiteCompetitor.id}`)}
              >
                View Pages
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <Input
                ref={inputRef}
                className="h-8 text-sm"
                value={websiteValue}
                onChange={(e) => setWebsiteValue(e.target.value)}
                placeholder="https://yoursite.com"
                onFocus={() => {
                  setTimeout(() => {
                    if (inputRef.current) {
                      const len = inputRef.current.value.length;
                      inputRef.current.setSelectionRange(len, len);
                    }
                  }, 0);
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={updateProject.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : project?.website ? (
            <div className="space-y-1">
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {project.website}
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
              <div>
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => {
                    setWebsiteValue(project.website ?? '');
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 text-xs text-muted-foreground"
              onClick={() => {
                setWebsiteValue('https://');
                setEditing(true);
              }}
            >
              + Add your website URL
            </Button>
          )}

          {projectSiteCompetitor?.last_crawled_at && (
            <p className="text-xs text-muted-foreground">
              Last crawled: {format(new Date(projectSiteCompetitor.last_crawled_at), 'MMM d, yyyy')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
