
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/lib/supabase';
import { hasData, getErrorMessage } from '@/utils/supabase-response-helpers';
import { asLeaseId } from '@/utils/type-casting';

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
        const responseAgreement = await supabase
          .from('leases')
          .select('vehicle_id')
          .eq('id', agreementId);

        if (!hasData(responseAgreement)) {
          console.error("Error fetching agreement for rent amount:", getErrorMessage(responseAgreement));
          setError(new Error(`Failed to fetch agreement: ${getErrorMessage(responseAgreement)}`));
          setIsLoading(false);
          return;
        }

        if (!responseAgreement.data || responseAgreement.data.length === 0) {
          setError(new Error('No agreement data found'));
          setIsLoading(false);
          return;
        }

        const vehicleId = responseAgreement.data[0]?.vehicle_id;
        
        if (!vehicleId) {
          setIsLoading(false);
          return;
        }

        // Fetch the vehicle to get rent_amount
        const responseVehicle = await supabase
          .from('vehicles')
          .select('rent_amount')
          .eq('id', vehicleId)
          .single();

        if (!hasData(responseVehicle)) {
          console.error("Error fetching vehicle rent amount:", getErrorMessage(responseVehicle));
          setError(new Error(`Failed to fetch vehicle: ${getErrorMessage(responseVehicle)}`));
          setIsLoading(false);
          return;
        }

        if (responseVehicle.data && responseVehicle.data.rent_amount !== null) {
          setRentAmount(responseVehicle.data.rent_amount);
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
