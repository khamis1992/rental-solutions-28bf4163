
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalCase } from '@/types/legal-case';

export const useLegalCases = () => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading for better UX
    setLoading(true);
    
    // Return empty array after loading simulation
    setTimeout(() => {
      setCases([]);
      setLoading(false);
    }, 800);
    
  }, []);

  return { cases, loading, error };
};
