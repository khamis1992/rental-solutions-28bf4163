
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { CalendarDays } from 'lucide-react';

export interface AgreementDetailsCardProps {
  agreement: Agreement;
  duration: number;
  rentAmount: number | null;
  contractAmount: number | null;
}

export function AgreementDetailsCard({ 
  agreement, 
  duration,
  rentAmount,
  contractAmount 
}: AgreementDetailsCardProps) {
  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Details</CardTitle>
        <CardDescription>Rental terms and payment information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="font-medium">Rental Period</p>
              <p className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Duration: {duration} {duration === 1 ? 'month' : 'months'}</p>
            </div>
            
            <div>
              <p className="font-medium">Additional Drivers</p>
              <p>{agreement.additional_drivers?.length ? agreement.additional_drivers.join(', ') : 'None'}</p>
            </div>
            
            <div>
              <p className="font-medium">Notes</p>
              <p className="whitespace-pre-line">{agreement.notes || 'No notes'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">Monthly Rent Amount</p>
              <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Total Contract Amount</p>
              <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
              <p className="text-xs text-muted-foreground">Monthly rent × {duration} months</p>
            </div>
            
            <div>
              <p className="font-medium">Deposit Amount</p>
              <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Terms Accepted</p>
              <p>{agreement.terms_accepted ? 'Yes' : 'No'}</p>
            </div>
            
            <div>
              <p className="font-medium">Signature</p>
              <p>{agreement.signature_url ? 'Signed' : 'Not signed'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
