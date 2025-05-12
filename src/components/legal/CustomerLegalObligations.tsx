
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { asProfileId } from '@/utils/database-type-helpers';

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

  useEffect(() => {
    const fetchObligations = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Fetch customer name first to include in obligations
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', asProfileId(customerId))
          .single();
          
        if (customerError) {
          console.error("Error fetching customer data:", customerError);
          setError("Failed to fetch customer information");
          setIsLoading(false);
          return;
        }

        // For now, just return a mock obligation
        const mockObligations: CustomerObligation[] = [
          {
            id: "ob-1",
            customerId: customerId,
            customerName: customerData?.full_name || "Unknown Customer",
            description: "Monthly vehicle lease payment",
            status: "overdue",
            dueDate: new Date(),
            createdAt: new Date(),
            amount: 1200,
            urgency: "high",
            daysOverdue: 5,
            obligationType: "payment"
          }
        ];
        
        setObligations(mockObligations);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching obligations:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchObligations();
  }, [customerId]); // Properly include customerId in the dependency array

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        {isLoading ? (
          <p className="text-muted-foreground">Loading obligations...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : obligations.length > 0 ? (
          <ul className="space-y-2">
            {obligations.map(obligation => (
              <li key={obligation.id} className="border-b pb-2">
                <p className="font-medium">{obligation.description}</p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className={obligation.status === 'overdue' ? 'text-red-500' : ''}>{obligation.status}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No legal obligations found for this customer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
