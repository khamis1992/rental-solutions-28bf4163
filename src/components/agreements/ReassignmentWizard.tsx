
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { AgreementService } from '@/services/agreements/agreements-service';

export interface ReassignmentWizardProps {
  agreementId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface AgreementDetails {
  id: string;
  agreementNumber: string;
  customerName: string;
  customerPhone: string;
}

export function ReassignmentWizard({ agreementId, onComplete, onCancel }: ReassignmentWizardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);

  useEffect(() => {
    fetchAgreementDetails();
  }, [agreementId]);
  
  async function fetchAgreementDetails() {
    setIsLoading(true);
    
    const response = await AgreementService.getAgreement(agreementId);
    
    if (response) {
      setAgreementDetails({
        id: response.id,
        agreementNumber: response.agreement_number || 'N/A',
        customerName: response.customer?.full_name || 'N/A',
        customerPhone: response.customer?.phone_number || 'N/A'
      });
    }
    
    setIsLoading(false);
  }

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
