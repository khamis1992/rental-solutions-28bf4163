
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

interface AgreementOverviewCardProps {
  agreement: any;
  rentAmount: number | null;
  contractAmount: number | null;
  calculateProgress: () => number;
}

export function AgreementOverviewCard({
  agreement,
  rentAmount,
  contractAmount,
  calculateProgress
}: AgreementOverviewCardProps) {
  return (
    <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
      <CardContent className="p-6 bg-zinc-100 rounded-md">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {agreement.created_at && <>Created on {format(new Date(agreement.created_at), 'MMMM d, yyyy')}</>}
            </p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
            <p className="text-2xl font-bold">QAR {rentAmount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Contract Total</p>
            <p className="text-2xl font-bold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white bg-opacity-80 p-4 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Deposit</p>
            <p className="text-2xl font-bold">QAR {agreement.deposit_amount?.toLocaleString() || 0}</p>
          </div>
        </div>
        
        {agreement.start_date && agreement.end_date && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Contract Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between text-xs mt-1">
              <span>{format(new Date(agreement.start_date), "MMM d, yyyy")}</span>
              <span>{format(new Date(agreement.end_date), "MMM d, yyyy")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
