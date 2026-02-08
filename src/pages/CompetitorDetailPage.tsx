import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { StatusBadge } from '@/components/competitors/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProject } from '@/hooks/useProjects';
import { useCompetitor, useCompetitorPages } from '@/hooks/useCompetitors';
import { ArrowLeft, ExternalLink, ChevronDown, FileText, Copy, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CompetitorDetailPage() {
  const { projectId, competitorId } = useParams<{ projectId: string; competitorId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitor, isLoading: competitorLoading } = useCompetitor(competitorId!);
  const { data: pages, isLoading: pagesLoading } = useCompetitorPages(competitorId!);

  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
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
          <p className="text-muted-foreground">Competitor not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(`/project/${projectId}`)}
          >
            Back to Competitors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectName={project?.name}>
      <Header
        title={competitor.name}
        subtitle="Competitor insights and scraped data"
      />

      <div className="p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 -ml-2"
          onClick={() => navigate(`/project/${projectId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Competitors
        </Button>

        {/* Competitor Info Card */}
        <Card className="mb-6 border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{competitor.name}</CardTitle>
                <CardDescription className="mt-1">
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {competitor.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </div>
              <StatusBadge status={competitor.last_crawled_at ? 'Active' : 'Pending'} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Last crawled:{' '}
              {competitor.last_crawled_at
                ? format(new Date(competitor.last_crawled_at), 'MMMM d, yyyy \'at\' HH:mm')
                : 'Never'}
            </p>
          </CardContent>
        </Card>

        {/* Scraped Pages */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Scraped Pages ({pages?.length ?? 0})
          </h2>
        </div>

        {pagesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pages && pages.length > 0 ? (
          <div className="space-y-3">
            {pages.map((page) => (
              <Collapsible
                key={page.id}
                open={expandedPage === page.id}
                onOpenChange={(open) => setExpandedPage(open ? page.id : null)}
              >
                <Card className="border-border/50">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {page.title || 'Untitled Page'}
                          </p>
                          <p className="text-sm text-muted-foreground">{page.url}</p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          expandedPage === page.id ? 'rotate-180' : ''
                        }`}
                      />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t border-border pt-4">
                      {/* Description */}
                      {page.description && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">Description</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => handleCopy(page.description!, `desc-${page.id}`)}
                            >
                              {copiedId === `desc-${page.id}` ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="rounded-lg bg-accent/50 p-4 text-sm text-foreground">
                            {page.description}
                          </p>
                        </div>
                      )}

                      {/* Markdown Content */}
                      {page.markdown_content && (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">Content</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => handleCopy(page.markdown_content!, `content-${page.id}`)}
                            >
                              {copiedId === `content-${page.id}` ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <ScrollArea className="h-48 rounded-lg border border-border bg-muted/50 p-4">
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                              {page.markdown_content}
                            </p>
                          </ScrollArea>
                        </div>
                      )}

                      {!page.description && !page.markdown_content && (
                        <p className="text-sm text-muted-foreground">
                          No content available for this page yet.
                        </p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">No pages scraped yet</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                The n8n workflow will populate pages once it scrapes this competitor.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
