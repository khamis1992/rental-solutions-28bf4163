
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AgreementDetailsSectionProps {
  agreement: any;
  startDate: string;
  endDate: string;
}

export const AgreementDetailsSection: React.FC<AgreementDetailsSectionProps> = ({
  agreement,
  startDate,
  endDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Agreement Number:</strong> {agreement.agreement_number}</p>
          <p><strong>Start Date:</strong> {startDate}</p>
          <p><strong>End Date:</strong> {endDate}</p>
          <p><strong>Status:</strong> {agreement.status}</p>
          <p><strong>Total Amount:</strong> {agreement.total_amount}</p>
        </div>
      </CardContent>
    </Card>
  );
};
