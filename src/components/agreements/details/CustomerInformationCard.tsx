import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';

export interface CustomerInformationCardProps {
  agreement: Agreement;
}

export function CustomerInformationCard({ agreement }: CustomerInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
        <CardDescription>Details about the customer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Name</p>
            <p>{agreement.customers?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Email</p>
            <p>{agreement.customers?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Phone</p>
            <p>{agreement.customers?.phone_number || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Address</p>
            <p>{agreement.customers?.address || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Driver License</p>
            <p>{agreement.customers?.driver_license || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
