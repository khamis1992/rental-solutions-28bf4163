
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { queryClient } from '@/lib/react-query';

// Define the validation result type
export interface ValidationResult {
  isValid: boolean;
  licensePlate: string;
  validationDate: string;
  status: string;
  fineDetails?: {
    violationType?: string;
    amount?: number;
    location?: string;
    date?: string;
  };
  errorMessage?: string;
}

// Function to validate a traffic fine
const validateFine = async (licensePlate: string): Promise<ValidationResult> => {
  try {
    console.log(`Validating traffic fine for license plate: ${licensePlate}`);
    
    // In a real app, this would call an external API
    // For demo purposes, we're creating a simulated validation result
    
    // Generate a random result, 80% chance of finding a fine
    const hasFine = Math.random() > 0.2;
    
    // Add a small delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Prepare the validation result
    const validationResult: ValidationResult = {
      isValid: true,
      licensePlate,
      validationDate: new Date().toISOString(),
      status: hasFine ? 'found' : 'not_found',
    };
    
    // Add fine details if a fine was found
    if (hasFine) {
      validationResult.fineDetails = {
        violationType: getRandomViolationType(),
        amount: Math.floor(Math.random() * 1000) + 100,
        location: getRandomLocation(),
        date: getRandomPastDate().toISOString(),
      };
    }
    
    // Log results to the database
    try {
      await supabase
        .from('traffic_fine_validations')
        .insert({
          fine_id: null, // No specific fine ID since this is just a validation
          result: validationResult as any, // Type conversion needed here
          status: validationResult.status,
          validation_date: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log validation attempt:', error);
      // Continue even if logging fails
    }
    
    return validationResult;
  } catch (error) {
    console.error('Error validating traffic fine:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return an error result
    return {
      isValid: false,
      licensePlate,
      validationDate: new Date().toISOString(),
      status: 'error',
      errorMessage: errorMessage
    };
  }
};

// Function to fetch validation history
const fetchValidationHistory = async () => {
  try {
    const { data, error } = await supabase
      .from('traffic_fine_validations')
      .select('*')
      .order('validation_date', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching validation history:', error);
    throw error;
  }
};

// Helper functions for random data generation
function getRandomViolationType() {
  const violations = [
    'Speeding',
    'Red light violation',
    'Illegal parking',
    'Wrong way driving',
    'Using mobile phone',
    'Not wearing seatbelt'
  ];
  return violations[Math.floor(Math.random() * violations.length)];
}

function getRandomLocation() {
  const locations = [
    'Corniche Road',
    'Al Sadd',
    'West Bay',
    'Pearl Boulevard',
    'Lusail City',
    'Al Waab Street'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getRandomPastDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 60) + 1; // Random date 1-60 days ago
  const date = new Date(now.setDate(now.getDate() - daysAgo));
  return date;
}

// Hook definition
export const useTrafficFinesValidation = () => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  
  // Mutation for validating traffic fines
  const validateTrafficFine = useMutation({
    mutationFn: validateFine,
    onSuccess: (result) => {
      setValidationResult(result);
      
      if (result.status === 'found') {
        toast.warning(`Traffic fine found for ${result.licensePlate}`, {
          description: `Fine amount: QAR ${result.fineDetails?.amount}`,
        });
      } else if (result.status === 'not_found') {
        toast.success(`No traffic fines found for ${result.licensePlate}`);
      } else {
        toast.error(`Error validating ${result.licensePlate}`, {
          description: result.errorMessage,
        });
      }
      
      // Refresh validation history
      queryClient.invalidateQueries({ queryKey: ['validationHistory'] });
    },
    onError: (error) => {
      toast.error('Validation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  // Query for validation history
  const { 
    data: validationHistory = [], 
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: ['validationHistory'],
    queryFn: fetchValidationHistory,
  });
  
  return {
    validateTrafficFine,
    validationResult,
    isValidating: validateTrafficFine.isPending,
    validationHistory,
    isLoadingHistory,
    historyError
  };
};
