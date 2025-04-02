
import React from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgreementDocumentsProps {
  agreement: Agreement;
}

export const AgreementDocuments = ({ agreement }: AgreementDocumentsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Documents</CardTitle>
        <CardDescription>Documents related to this agreement</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription className="text-center py-4">
            No documents available for this agreement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
