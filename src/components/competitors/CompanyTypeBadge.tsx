import { Badge } from '@/components/ui/badge';
import { CompanyType } from '@/types/database';

const COMPANY_TYPE_CONFIG: Record<CompanyType, { label: string; className: string }> = {
  direct_competitor: { label: 'Direct Competitor', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  indirect_competitor: { label: 'Indirect Competitor', className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
  geographic_competitor: { label: 'Geographic', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  aspirational: { label: 'Aspirational', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  market_leader: { label: 'Market Leader', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' },
  emerging_threat: { label: 'Emerging Threat', className: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' },
  partner: { label: 'Partner', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  customer: { label: 'Customer', className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' },
};

export function CompanyTypeBadge({ type }: { type: CompanyType | null }) {
  if (!type) return null;
  const config = COMPANY_TYPE_CONFIG[type];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
