import { CompetitorPage, CrawlJob } from '@/types/database';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { FileText, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CompetitorQuickStatsProps {
  pages: CompetitorPage[];
  lastCrawledAt: string | null;
}

export function CompetitorQuickStats({ pages, lastCrawledAt }: CompetitorQuickStatsProps) {
  const totalPages = pages.length;

  const scrapeStatusCounts = pages.reduce<Record<string, number>>((acc, p) => {
    const status = p.scrape_status ?? 'unknown';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const successCount = scrapeStatusCounts['success'] ?? 0;
  const pendingCount = scrapeStatusCounts['pending'] ?? 0;

  const categoryCounts = pages.reduce<Record<string, number>>((acc, p) => {
    const cat = (p.metadata as any)?.category ?? 'Uncategorized';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Pages"
        value={totalPages}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="Successfully Scraped"
        value={successCount}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Top Category"
        value={topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'N/A'}
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <StatsCard
        title="Last Crawled"
        value={lastCrawledAt ? format(new Date(lastCrawledAt), 'MMM d, yyyy') : 'Never'}
        icon={<Clock className="h-5 w-5" />}
      />
    </div>
  );
}
