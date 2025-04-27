
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery } from '@/hooks/use-supabase-query';
import { toast } from 'sonner';

interface ImportLog {
  id: string;
  file_name: string;
  original_file_name: string | null;
  status: string;
  created_at: string;
  processed_count: number;
  row_count: number;
  error_count: number;
  created_by: string | null;
}

export function useAgreementImports() {
  const [isLoading, setIsLoading] = useState(true);
  const [imports, setImports] = useState<ImportLog[]>([]);
  
  const fetchImportHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setImports(data as ImportLog[]);
    } catch (error) {
      console.error('Failed to fetch agreement imports:', error);
      toast.error('Failed to load import history');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchImportHistory();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('agreement_imports_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agreement_imports' }, 
        () => {
          fetchImportHistory();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const refetch = () => {
    fetchImportHistory();
  };
  
  return { imports, isLoading, refetch };
}
