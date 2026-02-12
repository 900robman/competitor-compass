import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanyTypes } from '@/hooks/useCompanyTypes';

interface CompanyTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  includeAll?: boolean;
  className?: string;
}

export function CompanyTypeSelect({ value, onValueChange, includeAll = false, className }: CompanyTypeSelectProps) {
  const types = useCompanyTypes();

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
