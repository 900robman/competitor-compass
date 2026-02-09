import { cn } from '@/lib/utils';

const scrapeStatusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-warning/15 text-warning', text: 'Pending' },
  processing: { bg: 'bg-[hsl(25,95%,53%)]/15 text-[hsl(25,95%,53%)]', text: 'Processing' },
  success: { bg: 'bg-success/15 text-success', text: 'Success' },
  failed: { bg: 'bg-destructive/15 text-destructive', text: 'Failed' },
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
