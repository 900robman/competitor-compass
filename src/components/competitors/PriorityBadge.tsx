import { Badge } from '@/components/ui/badge';
import { MonitoringPriority } from '@/types/database';
import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const PRIORITY_CONFIG: Record<MonitoringPriority, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  high: { label: 'High', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: ArrowUp },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', icon: ArrowRight },
  low: { label: 'Low', className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700', icon: ArrowDown },
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
