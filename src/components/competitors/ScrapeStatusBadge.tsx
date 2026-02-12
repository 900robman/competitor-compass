import { cn } from '@/lib/utils';

const scrapeStatusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-warning/15 text-warning', text: 'Pending' },
  processing: { bg: 'bg-primary/15 text-primary', text: 'Processing' },
  success: { bg: 'bg-success/15 text-success', text: 'Success' },
  scraped: { bg: 'bg-success/15 text-success', text: 'Scraped' },
  failed: { bg: 'bg-destructive/15 text-destructive', text: 'Failed' },
  not_scraped: { bg: 'bg-muted text-muted-foreground', text: 'Discovered' },
  completed: { bg: 'bg-success/15 text-success', text: 'Completed' },
  running: { bg: 'bg-primary/15 text-primary', text: 'Running' },
};

interface ScrapeStatusBadgeProps {
  status: string | null;
  className?: string;
}

export function ScrapeStatusBadge({ status, className }: ScrapeStatusBadgeProps) {
  const config = scrapeStatusConfig[status ?? ''] ?? {
    bg: 'bg-muted text-muted-foreground',
    text: status ?? 'Unknown',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.bg, className)}>
      {config.text}
    </span>
  );
}
