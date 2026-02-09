import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, Header } from '@/components/layout';
import { StatusBadge } from '@/components/competitors/StatusBadge';
import { CompetitorQuickStats } from '@/components/competitors/CompetitorQuickStats';
import { CompetitorActions } from '@/components/competitors/CompetitorActions';
import { DiscoveredPagesTable } from '@/components/competitors/DiscoveredPagesTable';
import { BrowseByCategory } from '@/components/competitors/BrowseByCategory';
import { CrawlHistoryTable } from '@/components/competitors/CrawlHistoryTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/hooks/useProjects';
import { useCompetitor, useCompetitorPages, useCrawlJobs } from '@/hooks/useCompetitors';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function CompetitorDetailPage() {
  const { projectId, competitorId } = useParams<{ projectId: string; competitorId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId!);
  const { data: competitor, isLoading: competitorLoading } = useCompetitor(competitorId!);
  const { data: pages = [], isLoading: pagesLoading } = useCompetitorPages(competitorId!);
  const { data: crawlJobs = [], isLoading: jobsLoading } = useCrawlJobs(competitorId!);

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
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/project/${projectId}`)}>
            Back to Competitors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout projectName={project?.name}>
      <Header title={competitor.name} subtitle="Competitor insights and scraped data" />

      <div className="p-6">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => navigate(`/project/${projectId}`)}>
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
                    href={competitor.main_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {competitor.main_url}
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
                ? format(new Date(competitor.last_crawled_at), "MMMM d, yyyy 'at' HH:mm")
                : 'Never'}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mb-6">
          <CompetitorActions competitor={competitor} pages={pages} />
        </div>

        {/* Quick Stats */}
        <CompetitorQuickStats pages={pages} lastCrawledAt={competitor.last_crawled_at} />

        {/* Discovered Pages */}
        <DiscoveredPagesTable pages={pages} isLoading={pagesLoading} />

        {/* Browse by Category */}
        <BrowseByCategory pages={pages} />

        {/* Crawl History */}
        <CrawlHistoryTable jobs={crawlJobs} isLoading={jobsLoading} />
      </div>
    </DashboardLayout>
  );
}
