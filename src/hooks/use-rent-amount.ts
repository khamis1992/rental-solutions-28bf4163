
import { useState, useEffect } from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { hasData, hasProperty } from '@/utils/database-type-helpers';

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

        // Check if the agreement data exists and has a vehicle_id
        const agreementResponse = { data: agreementData, error: agreementError };
        if (hasProperty(agreementResponse, 'vehicle_id') && agreementResponse.data.vehicle_id) {
          // Fetch the vehicle to get rent_amount
          const vehicleId = agreementResponse.data.vehicle_id;
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
            .select('rent_amount')
            .eq('id', vehicleId as any)
            .single();

          if (vehicleError) {
            console.error("Error fetching vehicle rent amount:", vehicleError);
            setError(new Error(`Failed to fetch vehicle: ${vehicleError.message}`));
            setIsLoading(false);
            return;
          }

          // Check if vehicle data exists and has rent_amount
          const vehicleResponse = { data: vehicleData, error: vehicleError };
          if (hasProperty(vehicleResponse, 'rent_amount') && vehicleResponse.data.rent_amount !== undefined) {
            setRentAmount(vehicleResponse.data.rent_amount);
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
