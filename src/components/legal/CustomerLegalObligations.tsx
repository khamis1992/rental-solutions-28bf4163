
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CustomerObligation {
  id: string;
  description: string;
  customerId: string;
  customerName: string;
  obligationType: string;
  amount: number;
  lateFine: number;
  urgency: string;
  status: string;
  dueDate: Date;
  daysOverdue: number;
  agreementId?: string;
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
