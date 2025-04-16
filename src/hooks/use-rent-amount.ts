
import { useState, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { hasData } from '@/utils/database-type-helpers';

export const useRentAmount = (agreement: Agreement | null, agreementId: string | undefined) => {
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we already have an agreement with rent_amount, use that value
    if (agreement?.rent_amount) {
      setRentAmount(agreement.rent_amount);
      return;
    }

    // If we don't have the agreement ID, exit early
    if (!agreementId) {
      return;
    }

    const fetchRentAmount = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get rent_amount from vehicles table based on vehicle_id in agreement
        const { data: agreementData, error: agreementError } = await supabase
          .from('leases')
          .select('vehicle_id')
          .eq('id', agreementId as any)
          .single();

        if (agreementError) {
          console.error("Error fetching agreement for rent amount:", agreementError);
          setError(new Error(`Failed to fetch agreement: ${agreementError.message}`));
          setIsLoading(false);
          return;
        }

        if (agreementData && agreementData.vehicle_id) {
          // Fetch the vehicle to get rent_amount
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('rent_amount')
            .eq('id', agreementData.vehicle_id as any)
            .single();

          if (vehicleError) {
            console.error("Error fetching vehicle rent amount:", vehicleError);
            setError(new Error(`Failed to fetch vehicle: ${vehicleError.message}`));
            setIsLoading(false);
            return;
          }

          if (vehicleData && vehicleData.rent_amount !== undefined) {
            setRentAmount(vehicleData.rent_amount);
          }
        }
      } catch (err) {
        console.error("Unexpected error in fetchRentAmount:", err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentAmount();
  }, [agreement, agreementId]);

  return { rentAmount, isLoading, error };
};
