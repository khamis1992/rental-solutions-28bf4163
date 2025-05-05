
import React from 'react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgreementCardProps {
  agreement: any;
  onClick?: () => void;
}

export const AgreementCard: React.FC<AgreementCardProps> = ({ agreement, onClick }) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Agreement #{agreement.agreement_number}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(agreement.start_date)} - {formatDate(agreement.end_date)}
            </p>
          </div>
          <Badge variant={getStatusVariant(agreement.status)}>
            {agreement.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p>{agreement.customers?.full_name || agreement.customer_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p>{formatCurrency(agreement.total_amount || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for styling based on status
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'closed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'expired':
      return 'outline';
    default:
      return 'default';
  }
}
