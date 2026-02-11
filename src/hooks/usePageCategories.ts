import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageCategory {
  id: string;
  name: string;
  url_patterns: string[];
  description: string | null;
  color: string | null;
  icon: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePageCategories() {
  return useQuery({
    queryKey: ['pageCategories'],
    queryFn: async (): Promise<PageCategory[]> => {
      const { data, error } = await supabase
        .from('page_categories')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PageCategory[];
    },
  });
}
