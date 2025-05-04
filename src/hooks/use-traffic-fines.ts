
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ValidationResultType } from '@/components/fines/validation/types';

export interface TrafficFine {
  id: string;
  license_plate?: string;
  fine_amount?: number;
  violation_date?: string;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'disputed';
  validation_status: 'pending' | 'validated' | 'failed';
  fine_type?: string;
  validation_result?: any;
  violation_number?: string;
  serial_number?: string;
  location?: string;
  violation_charge?: string;
  lease_id?: string;
}

export function useTrafficFines() {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch traffic fines with optional status filter
  const fetchTrafficFines = async (status: string = 'all') => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('traffic_fines')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (status !== 'all') {
        query = query.eq('payment_status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch traffic fines: ${error.message}`);
      }
      
      setTrafficFines(data as TrafficFine[]);
    } catch (err) {
      console.error('Error fetching traffic fines:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch traffic fines'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update traffic fine status
  const updateTrafficFineStatus = async (fineId: string, status: 'pending' | 'paid' | 'disputed') => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .update({ payment_status: status, payment_date: status === 'paid' ? new Date() : null })
        .eq('id', fineId);
        
      if (error) {
        throw new Error(`Failed to update traffic fine status: ${error.message}`);
      }
      
      // Update the local state to reflect the change
      setTrafficFines(prevFines => 
        prevFines.map(fine => 
          fine.id === fineId
            ? { ...fine, payment_status: status, payment_date: status === 'paid' ? new Date().toISOString() : null }
            : fine
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error updating traffic fine status:', err);
      throw err;
    }
  };
  
  // Validate a traffic fine
  const validateTrafficFine = async (fineId: string, licensePlate: string): Promise<ValidationResultType> => {
    try {
      // This would normally call an external API or service
      // For now, we'll simulate a validation response
      const isValid = Math.random() > 0.2; // 80% chance of successful validation
      const hasFine = Math.random() > 0.5; // 50% chance of having a fine
      
      // Update the validation status in the database
      const { error: updateError } = await supabase
        .from('traffic_fines')
        .update({
          validation_status: isValid ? 'validated' : 'failed',
          validation_result: {
            validated_at: new Date(),
            has_fine: hasFine,
            details: hasFine ? 'Traffic fine confirmed' : 'No traffic fine found'
          },
          validation_date: new Date()
        })
        .eq('id', fineId);
        
      if (updateError) {
        throw new Error(`Failed to update validation status: ${updateError.message}`);
      }
      
      // Record the validation in a separate validation log
      const { error: logError } = await supabase
        .from('traffic_fine_validations')
        .insert({
          fine_id: fineId,
          license_plate: licensePlate,
          validation_source: 'manual',
          result: {
            has_fine: hasFine,
            is_valid: isValid,
            details: hasFine ? 'Traffic fine confirmed' : 'No traffic fine found'
          }
        });
        
      if (logError) {
        console.error('Error logging validation:', logError);
      }
      
      // Update the local state
      setTrafficFines(prevFines => 
        prevFines.map(fine => 
          fine.id === fineId
            ? { 
                ...fine, 
                validation_status: isValid ? 'validated' : 'failed',
                validation_result: {
                  validated_at: new Date(),
                  has_fine: hasFine,
                  details: hasFine ? 'Traffic fine confirmed' : 'No traffic fine found'
                },
                validation_date: new Date().toISOString()
              }
            : fine
        )
      );
      
      return {
        isValid,
        message: isValid ? 'Validation successful' : 'Validation failed',
        licensePlate,
        validationDate: new Date(),
        validationSource: 'system',
        hasFine,
        details: hasFine ? 'Traffic fine confirmed' : 'No traffic fine found'
      };
    } catch (err) {
      console.error('Error validating traffic fine:', err);
      throw err;
    }
  };

  // Create a new traffic fine
  export interface TrafficFineCreatePayload {
    violationNumber: string;
    licensePlate: string;
    violationDate: Date;
    fineAmount: number;
    violationCharge?: string;
    location?: string;
    paymentStatus: 'pending' | 'paid' | 'disputed';
  }

  const createTrafficFine = async (data: TrafficFineCreatePayload) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .insert({
          violation_number: data.violationNumber,
          license_plate: data.licensePlate,
          violation_date: data.violationDate.toISOString(),
          fine_amount: data.fineAmount,
          violation_charge: data.violationCharge,
          location: data.location,
          payment_status: data.paymentStatus,
          validation_status: 'pending'
        });
      
      if (error) {
        throw new Error(`Failed to create traffic fine: ${error.message}`);
      }
      
      // Refresh the fines list
      fetchTrafficFines();
      
      return { success: true };
    } catch (err) {
      console.error('Error creating traffic fine:', err);
      throw err;
    }
  };
  
  // Load traffic fines on component mount
  useEffect(() => {
    fetchTrafficFines();
  }, []);
  
  return {
    trafficFines,
    isLoading,
    error,
    refetchTrafficFines: fetchTrafficFines,
    updateTrafficFineStatus,
    validateTrafficFine,
    createTrafficFine
  };
}

export type { TrafficFineCreatePayload };
