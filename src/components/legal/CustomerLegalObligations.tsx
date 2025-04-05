
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define the types we need to export
export type ObligationType = 'payment' | 'traffic_fine' | 'legal_case';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CustomerObligation {
  id: string;
  description: string;
  customerId: string;
  customerName: string;
  obligationType: ObligationType;
  amount: number;
  lateFine: number;
  urgency: UrgencyLevel;
  status: string;
  dueDate: Date;
  daysOverdue: number;
  agreementId?: string;
  agreementNumber?: string; // Add this missing property
}

interface CustomerLegalObligationsProps {
  customerId: string;
}

const CustomerLegalObligations: React.FC<CustomerLegalObligationsProps> = ({ customerId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Obligations</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Customer legal obligations will be displayed here</p>
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
