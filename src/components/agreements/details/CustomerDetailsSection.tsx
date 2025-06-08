
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomerDetailsSectionProps {
  customer: any;
}

export const CustomerDetailsSection: React.FC<CustomerDetailsSectionProps> = ({
  customer
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Name:</strong> {customer?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
          <p><strong>Phone:</strong> {customer?.phone || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
