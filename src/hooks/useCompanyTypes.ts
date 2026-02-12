import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyTypeRecord {
  id: string;
  value: string;
  label: string;
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useCompanyTypes() {
  return useQuery({
    queryKey: ['companyTypes'],
    queryFn: async (): Promise<CompanyTypeRecord[]> => {
      const { data, error } = await supabase
        .from('company_types')
        .select('*')
        .order('label', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CompanyTypeRecord[];
    },
  });
}

export function useActiveCompanyTypes() {
  const { data = [], ...rest } = useCompanyTypes();
  return { data: data.filter((t) => t.is_active), ...rest };
}

export function useCreateCompanyType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { value: string; label: string; color: string; description?: string }) => {
      const { data, error } = await supabase
        .from('company_types')
        .insert({
          value: input.value,
          label: input.label,
          color: input.color,
          description: input.description || null,
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyTypes'] });
    },
  });
}

export function useUpdateCompanyType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompanyTypeRecord> }) => {
      const { data, error } = await supabase
        .from('company_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyTypes'] });
    },
  });
}

export function useDeleteCompanyType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyTypes'] });
    },
  });
}

/** Count how many competitors use a given company_type value */
export function useCompanyTypeUsageCount(value: string) {
  return useQuery({
    queryKey: ['companyTypeUsage', value],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('competitors')
        .select('*', { count: 'exact', head: true })
        .eq('company_type', value);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!value,
  });
}
