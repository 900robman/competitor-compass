import { Badge } from '@/components/ui/badge';
import { useActiveCompanyTypes } from '@/hooks/useCompanyTypes';

// Hardcoded fallback for when DB types aren't loaded yet
const FALLBACK_CONFIG: Record<string, { label: string; color: string }> = {
  direct_competitor: { label: 'Direct Competitor', color: '#ef4444' },
  indirect_competitor: { label: 'Indirect Competitor', color: '#f97316' },
  geographic_competitor: { label: 'Geographic', color: '#3b82f6' },
  aspirational: { label: 'Aspirational', color: '#a855f7' },
  market_leader: { label: 'Market Leader', color: '#eab308' },
  emerging_threat: { label: 'Emerging Threat', color: '#ec4899' },
  partner: { label: 'Partner', color: '#22c55e' },
  customer: { label: 'Customer', color: '#6366f1' },
};

export function CompanyTypeBadge({ type }: { type: string | null }) {
  const { data: dbTypes = [] } = useActiveCompanyTypes();

  if (!type) return null;

  const dbType = dbTypes.find((t) => t.value === type);
  const fallback = FALLBACK_CONFIG[type];
  const label = dbType?.label ?? fallback?.label ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const color = dbType?.color ?? fallback?.color ?? '#6366f1';

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
