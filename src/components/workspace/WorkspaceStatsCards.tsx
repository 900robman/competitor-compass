import { Building2, Activity, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Competitor } from '@/types/database';

interface WorkspaceStatsCardsProps {
  competitors: Competitor[];
}

export function WorkspaceStatsCards({ competitors }: WorkspaceStatsCardsProps) {
  const activeCrawls = competitors.filter((c) => c.active_crawl_job_id).length;

  const mostRecent = competitors.reduce<string | null>((latest, c) => {
    if (!c.last_crawled_at) return latest;
    if (!latest) return c.last_crawled_at;
    return c.last_crawled_at > latest ? c.last_crawled_at : latest;
  }, null);

  const stats = [
    {
      label: 'Total Companies',
      value: competitors.length,
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      label: 'Active Crawls',
      value: activeCrawls,
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: 'Recent Updates',
      value: mostRecent ? format(new Date(mostRecent), 'MMM d, yyyy') : '—',
      icon: <Calendar className="h-4 w-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{stat.value}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
