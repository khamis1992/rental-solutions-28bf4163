
import React from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementOverviewTabProps {
  agreement: Agreement;
}

export const AgreementOverviewTab = ({ agreement }: AgreementOverviewTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Summary</CardTitle>
        <CardDescription>Key details about the rental agreement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Customer</h3>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p>{agreement.customers?.full_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">Contact</p>
              <p>{agreement.customers?.phone_number || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Rental Period</h3>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {agreement.start_date && format(new Date(agreement.start_date), "MMMM d, yyyy")} to{' '}
                  {agreement.end_date && format(new Date(agreement.end_date), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Vehicle</h3>
              <p className="text-sm text-muted-foreground mb-1">Details</p>
              <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">License Plate</p>
              <p>{agreement.vehicles?.license_plate || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Additional Information</h3>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="whitespace-pre-line">{agreement.notes || 'No notes'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
