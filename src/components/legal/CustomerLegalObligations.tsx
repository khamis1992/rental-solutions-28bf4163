import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';

export interface CustomerLegalObligationsProps {
  customerId?: string;
}

export interface CustomerObligation {
  id: string;
  description: string;
  status: string;
  dueDate?: Date;
  createdAt: Date;
  // Additional fields needed by LegalCaseDetails
  customerId?: string;
  customerName?: string;
  amount?: number;
  urgency?: string;
  daysOverdue?: number;
  obligationType?: string;
}

export const CustomerLegalObligations: React.FC<CustomerLegalObligationsProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getLegalCases } = useLegalCaseQuery();
  const { data: legalCases, isLoading: casesLoading, isError, error: queryError } = 
    customerId ? getLegalCases({ customerId }) : { data: null, isLoading: false, isError: false, error: null };

  useEffect(() => {
    if (!customerId) {
      console.log("CustomerLegalObligations: No customerId provided");
      setIsLoading(false);
      return;
    }
    
    if (isError && queryError) {
      console.error("CustomerLegalObligations: Error fetching legal cases:", queryError);
      setError(queryError instanceof Error ? queryError.message : "Failed to fetch legal obligations");
      setIsLoading(false);
      return;
    }
    
    if (!casesLoading && legalCases) {
      const mappedObligations = legalCases.map(legalCase => ({
        id: legalCase.id,
        customerId: legalCase.customer_id,
        customerName: legalCase.customer_name || 'Unknown Customer',
        description: legalCase.description || '',
        obligationType: 'legal_case',
        amount: legalCase.amount_owed || 0,
        dueDate: legalCase.due_date ? new Date(legalCase.due_date) : undefined,
        urgency: legalCase.priority?.toLowerCase() || 'medium',
        status: legalCase.status || 'pending',
        daysOverdue: legalCase.days_overdue || 0,
        createdAt: new Date(legalCase.created_at || new Date())
      }));
      
      setObligations(mappedObligations);
      setIsLoading(false);
    }
  }, [customerId, legalCases, casesLoading, isError, queryError]);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading legal obligations...</p>
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">
            <p>{error}</p>
          </div>
        ) : obligations.length > 0 ? (
          <div className="space-y-4">
            {obligations.map(obligation => (
              <div key={obligation.id} className="p-4 rounded-md border">
                <p className="font-medium">{obligation.description}</p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium">{obligation.status}</span>
                  {obligation.dueDate && (
                    <> · Due: <span className="font-medium">{obligation.dueDate.toLocaleDateString()}</span></>
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No legal obligations found for this customer.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
