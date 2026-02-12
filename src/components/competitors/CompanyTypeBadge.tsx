import { Badge } from '@/components/ui/badge';
import { useCompanyTypes, CompanyTypeConfig } from '@/hooks/useCompanyTypes';

export function CompanyTypeBadge({ type }: { type: string | null }) {
  const types = useCompanyTypes();

  if (!type) return null;

  const config = types.find((t) => t.value === type);
  const label = config?.label ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const color = config?.color ?? '#6366f1';

  return (
    <Badge
      variant="outline"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}40`,
      }}
    >
      {label}
    </Badge>
  );
}
