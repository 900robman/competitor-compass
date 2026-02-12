import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActiveCompanyTypes } from '@/hooks/useCompanyTypes';

// Hardcoded fallback types
const FALLBACK_TYPES = [
  { value: 'direct_competitor', label: 'Direct Competitor' },
  { value: 'indirect_competitor', label: 'Indirect Competitor' },
  { value: 'geographic_competitor', label: 'Geographic' },
  { value: 'aspirational', label: 'Aspirational' },
  { value: 'market_leader', label: 'Market Leader' },
  { value: 'emerging_threat', label: 'Emerging Threat' },
  { value: 'partner', label: 'Partner' },
  { value: 'customer', label: 'Customer' },
];

interface CompanyTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  includeAll?: boolean;
  className?: string;
}

export function CompanyTypeSelect({ value, onValueChange, includeAll = false, className }: CompanyTypeSelectProps) {
  const { data: dbTypes = [] } = useActiveCompanyTypes();
  const types = dbTypes.length > 0
    ? dbTypes.map((t) => ({ value: t.value, label: t.label }))
    : FALLBACK_TYPES;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All Company Types</SelectItem>}
        {types.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
