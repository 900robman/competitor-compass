import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { color: string; dotColor: string }> = {
    Active: { color: 'bg-success/10 text-success', dotColor: 'bg-success' },
    Pending: { color: 'bg-warning/10 text-warning', dotColor: 'bg-warning' },
    Error: { color: 'bg-destructive/10 text-destructive', dotColor: 'bg-destructive' },
  };

  const config = statusConfig[status] ?? { color: 'bg-muted text-muted-foreground', dotColor: 'bg-muted-foreground' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      {status}
    </span>
  );
}
