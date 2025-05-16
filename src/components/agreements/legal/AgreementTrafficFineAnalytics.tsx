
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface TrafficFine {
  id: string;
  license_plate: string;
  violation_date: string;
  fine_amount: number;
  payment_status: string;
  fine_type?: string;
}

interface PaginatedTrafficFineResult {
  data: TrafficFine[];
  count: number;
}

interface AgreementTrafficFineAnalyticsProps {
  fines: TrafficFine[] | PaginatedTrafficFineResult;
}

export const AgreementTrafficFineAnalytics: React.FC<AgreementTrafficFineAnalyticsProps> = ({ fines }) => {
  // Calculate analytics from the fines data
  const getFinesArray = () => {
    if (Array.isArray(fines)) {
      return fines;
    } 
    return fines?.data || [];
  };

  const finesArray = getFinesArray();
  
  const totalFines = finesArray.length;
  const totalAmount = finesArray.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);
  const paidFines = finesArray.filter(fine => fine.payment_status === 'paid').length;
  const pendingFines = finesArray.filter(fine => fine.payment_status !== 'paid').length;
  const pendingAmount = finesArray
    .filter(fine => fine.payment_status !== 'paid')
    .reduce((sum, fine) => sum + (fine.fine_amount || 0), 0);

  if (!totalFines) {
    return null; // Don't show analytics if there are no fines
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalFines}</div>
          <p className="text-muted-foreground text-sm">Total Fines</p>
          <div className="mt-2 text-lg font-semibold">{formatCurrency(totalAmount)}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{paidFines}</div>
          <p className="text-muted-foreground text-sm">Paid Fines</p>
          <div className="mt-2 text-lg font-semibold">
            {formatCurrency(totalAmount - pendingAmount)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-red-600">{pendingFines}</div>
          <p className="text-muted-foreground text-sm">Pending Fines</p>
          <div className="mt-2 text-lg font-semibold">{formatCurrency(pendingAmount)}</div>
        </CardContent>
      </Card>
    </div>
  );
};
