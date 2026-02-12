import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-0.5 text-2xl font-semibold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-0.5 text-sm',
                trend.positive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.positive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
