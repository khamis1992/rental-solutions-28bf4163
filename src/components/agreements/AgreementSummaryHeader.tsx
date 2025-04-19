
import React from 'react';
import { format } from 'date-fns';
import { CalendarDays, User, Car, CreditCard } from 'lucide-react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { Badge } from '@/components/ui/badge';

interface AgreementSummaryHeaderProps {
  agreement: Agreement | null;
  rentAmount: number | null;
}

export function AgreementSummaryHeader({ agreement, rentAmount }: AgreementSummaryHeaderProps) {
  const formattedStatus = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">UNKNOWN</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'pending':
        return <Badge variant="warning">PENDING</Badge>;
      case 'closed':
        return <Badge variant="secondary">CLOSED</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">CANCELLED</Badge>;
      case 'expired':
        return <Badge variant="outline">EXPIRED</Badge>;
      case 'draft':
        return <Badge className="bg-purple-500 text-white">DRAFT</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  // If agreement is null, show a loading or placeholder state
  if (!agreement) {
    return (
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Loading Agreement...
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Make sure start_date and end_date are valid Date objects
  let startDate, endDate;
  
  try {
    startDate = agreement.start_date instanceof Date 
      ? agreement.start_date 
      : agreement.start_date ? new Date(agreement.start_date) : new Date();
  } catch (error) {
    console.error('Error parsing start_date:', error);
    startDate = new Date();
  }
  
  try {
    endDate = agreement.end_date instanceof Date 
      ? agreement.end_date 
      : agreement.end_date ? new Date(agreement.end_date) : new Date();
  } catch (error) {
    console.error('Error parsing end_date:', error);
    endDate = new Date();
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Agreement {agreement.agreement_number}
            </h1>
            {formattedStatus(agreement.status)}
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{agreement.customers?.full_name || 'N/A'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>
                {agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 bg-white shadow-sm rounded-md p-3 border border-slate-200 flex items-center">
          <div>
            <div className="text-sm text-muted-foreground">Monthly Rent</div>
            <div className="text-xl font-bold flex items-center gap-1">
              <CreditCard className="h-4 w-4 text-green-500" />
              QAR {rentAmount?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
