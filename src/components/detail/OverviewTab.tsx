import { useMemo } from 'react';
import { CompetitorPage, CrawlJob } from '@/types/database';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, BarChart3, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface OverviewTabProps {
  pages: CompetitorPage[];
  crawlJobs: CrawlJob[];
  lastCrawledAt: string | null;
}

function getCategory(page: CompetitorPage): string {
  return page.category ?? (page.metadata as any)?.category ?? 'Uncategorized';
}

interface ActivityEvent {
  id: string;
  type: 'crawl' | 'page' | 'category';
  description: string;
  timestamp: string;
}

export function OverviewTab({ pages, crawlJobs, lastCrawledAt }: OverviewTabProps) {
  const totalPages = pages.length;
  const successCount = pages.filter((p) => p.scrape_status === 'success').length;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pages.forEach((p) => {
      const cat = getCategory(p);
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [pages]);

  const topCategory = categoryCounts[0];

  // Build activity timeline from crawl jobs + recent pages
  const activities = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    crawlJobs.slice(0, 10).forEach((job) => {
      const statusLabel = job.status === 'completed' ? 'completed successfully' : job.status === 'failed' ? 'failed' : job.status;
      events.push({
        id: `job-${job.id}`,
        type: 'crawl',
        description: `${job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)} ${statusLabel}`,
        timestamp: job.completed_at ?? job.started_at,
      });
    });

    // Recent pages (last 10 by created_at)
    const recentPages = [...pages]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    recentPages.forEach((page) => {
      let path = page.url;
      try {
        const u = new URL(page.url.startsWith('http') ? page.url : `https://${page.url}`);
        path = u.pathname;
      } catch {}
      events.push({
        id: `page-${page.id}`,
        type: 'page',
        description: `New page discovered: ${path}`,
        timestamp: page.created_at,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);
  }, [crawlJobs, pages]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Discovered Pages"
          value={totalPages}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Scraped"
          value={successCount}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatsCard
          title="Top Category"
          value={topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'N/A'}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Recent Activity Timeline */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity Timeline</h3>
        {activities.length > 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activities.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
