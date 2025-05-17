import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface CustomerInformationCardProps {
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
            <p className="font-medium text-sm">Name</p>
            <p className="text-sm">{agreement.customers?.full_name ?? 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium text-sm">Email</p>
            <p className="text-sm">{agreement.customers?.email ?? 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium text-sm">Phone</p>
            <p className="text-sm">{agreement.customers?.phone_number ?? 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium text-sm">Address</p>
            <p className="text-sm">{agreement.customers?.address ?? 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium text-sm">Driver License</p>
            <p className="text-sm">{agreement.customers?.driver_license ?? 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}