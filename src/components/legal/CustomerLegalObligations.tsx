
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CustomerLegalObligationsProps } from './CustomerLegalObligations';

// This is a placeholder component that will be implemented in the future
export const CustomerLegalObligations: React.FC<CustomerLegalObligationsProps> = ({ customerId }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        <p className="text-muted-foreground">
          Legal obligations information will be available soon.
        </p>
      </CardContent>
    </Card>
  );
};
