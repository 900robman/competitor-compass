import { Badge } from '@/components/ui/badge';
import { MonitoringPriority } from '@/types/database';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const PRIORITY_CONFIG: Record<MonitoringPriority, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  high: { label: 'High', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: ArrowUp },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning border-warning/20', icon: ArrowRight },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border', icon: ArrowDown },
};

export function PriorityBadge({ priority }: { priority: MonitoringPriority | null }) {
  if (!priority) return null;
  const { label, className, icon: Icon } = PRIORITY_CONFIG[priority];
  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
}
