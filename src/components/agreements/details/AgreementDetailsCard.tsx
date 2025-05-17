import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { CalendarDays } from 'lucide-react';

interface AgreementDetailsCardProps {
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
              <p className="flex items-center text-sm">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Duration: {duration} {duration === 1 ? 'month' : 'months'}
              </p>
            </div>

            <div>