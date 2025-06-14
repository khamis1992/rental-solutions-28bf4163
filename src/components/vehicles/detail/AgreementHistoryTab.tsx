
import React from 'react';
import { useVehicleAgreements } from '@/hooks/use-vehicle-agreements';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AgreementHistoryTabProps {
  vehicleId?: string;
}

export const AgreementHistoryTab: React.FC<AgreementHistoryTabProps> = ({ vehicleId }) => {
  const { agreements, isLoading, error } = useVehicleAgreements(vehicleId);
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p>Error loading agreements: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!agreements || agreements.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <p>No agreements found for this vehicle.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {agreements.map((agreement) => (
        <Card key={agreement.id} className="overflow-hidden">
          <div className="bg-muted p-4 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              <div>
                <h3 className="font-medium">
                  Agreement {agreement.agreement_number || `#${agreement.id.substring(0, 8)}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Customer: {agreement.customers?.full_name || 'Unknown'}
                </p>
              </div>
            </div>
            <StatusBadge status={agreement.status} />
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p>{formatDate(agreement.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p>{formatDate(agreement.end_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p>{formatCurrency(agreement.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p>{formatDate(agreement.created_at)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(`/agreements/${agreement.id}`)}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-700 border-green-600';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-600';
      case 'completed':
        return 'bg-blue-500/20 text-blue-700 border-blue-600';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-600';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-600';
    }
  };

  return (
    <Badge className={`${getStatusColor()} rounded-full px-3 py-1 font-medium text-xs`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
