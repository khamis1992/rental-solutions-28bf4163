import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { asLeaseId, isValidResponse } from '@/utils/database-type-helpers';

export interface ReassignmentWizardProps {
  agreementId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ReassignmentWizard({ agreementId, onComplete, onCancel }: ReassignmentWizardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [agreement, setAgreement] = useState<any>(null);

  // Fetch agreement details
  useEffect(() => {
    async function fetchAgreementDetails() {
      try {
        setIsLoading(true);
        
        // Use asLeaseId for type safety
        const typedLeaseId = asLeaseId(agreementId);
        
        const { data, error } = await supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            customer:customer_id (
              id,
              full_name,
              phone_number
            )
          `)
          .eq('id', typedLeaseId)
          .single();
        
        if (error) throw error;
        
        if (isValidResponse({ data, error })) {
          setAgreement(data);
        }
      } catch (error) {
        console.error('Error fetching agreement details:', error);
        toast.error('Could not load agreement details');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAgreementDetails();
  }, [agreementId]);
  
  // If agreement data is available, safely access the properties
  const agreementDetails = agreement ? {
    id: agreement.id,
    agreementNumber: agreement.agreement_number,
    customerName: agreement.customer?.full_name || 'N/A',
    customerPhone: agreement.customer?.phone_number || 'N/A'
  } : null;

  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div>Loading agreement details...</div>
        ) : agreementDetails ? (
          <div>
            <h3 className="font-medium mb-4">Reassignment for Agreement #{agreementDetails.agreementNumber}</h3>
            <div className="mb-6">
              <p>Current Customer: {agreementDetails.customerName}</p>
              <p>Phone: {agreementDetails.customerPhone}</p>
            </div>
            
            {/* Rest of the reassignment wizard would go here */}
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onComplete}>
                Complete Reassignment
              </Button>
            </div>
          </div>
        ) : (
          <div>Agreement not found</div>
        )}
      </CardContent>
    </Card>
  );
}
