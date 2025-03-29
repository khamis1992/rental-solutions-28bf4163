
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RiskMetrics {
  paymentHistory: number;
  rentalFrequency: number;
  incidentHistory: number;
  documentCompliance: number;
}

export const useRiskScoring = (customerId: string) => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateRiskScore = (metrics: RiskMetrics) => {
    const weights = {
      paymentHistory: 0.4,
      rentalFrequency: 0.2,
      incidentHistory: 0.3,
      documentCompliance: 0.1
    };

    return Object.entries(metrics).reduce((score, [key, value]) => {
      return score + value * weights[key as keyof typeof weights];
    }, 0);
  };

  useEffect(() => {
    const fetchRiskMetrics = async () => {
      try {
        const { data, error } = await supabase
          .from('customer_risk_metrics')
          .select('*')
          .eq('customer_id', customerId)
          .single();

        if (error) throw error;

        setRiskMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching risk metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskMetrics();
  }, [customerId]);

  return { riskMetrics, loading, error, calculateRiskScore };
};
