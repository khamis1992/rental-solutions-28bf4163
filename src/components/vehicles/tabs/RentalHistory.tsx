
import React, { useEffect } from 'react';
import { Vehicle } from '@/types/vehicle';
import { SimpleAgreement } from '@/types/agreement';
import { CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Car } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useAgreements } from '@/hooks/use-agreements';
import { useCacheManager } from '@/hooks/use-cache-manager';

interface RentalHistoryProps {
  vehicle: Vehicle;
}

const RentalHistory = ({ vehicle }: RentalHistoryProps) => {
  const navigate = useNavigate();
  const { agreements, isLoading, error, refetch } = useAgreements({ vehicleId: vehicle.id });
  const { prefetchEntity } = useCacheManager();

  // Prefetch agreement data when hovering over links
  const handleAgreementHover = (agreementId: string) => {
    prefetchEntity('agreements', agreementId);
  };

  useEffect(() => {
    // Refetch data when the component mounts
    refetch();
  }, [refetch]);

  return (
    <CardContent>
      <h3 className="text-lg font-semibold mb-4">Rental History</h3>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : agreements && agreements.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Agreement #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agreements.map((agreement: SimpleAgreement) => (
                <tr key={agreement.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => navigate(`/agreements/${agreement.id}`)}
                      onMouseEnter={() => handleAgreementHover(agreement.id)}
                    >
                      {agreement.agreement_number}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(agreement.customer?.full_name || agreement.customers?.full_name) || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={
                      agreement.status === 'ACTIVE' ? 'success' :
                      agreement.status === 'PENDING' ? 'warning' :
                      agreement.status === 'EXPIRED' ? 'secondary' :
                      'outline'
                    }>
                      {agreement.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {formatCurrency(agreement.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <h4 className="text-lg font-medium mb-2">No rental history found</h4>
          <p className="text-muted-foreground mb-4">This vehicle hasn't been rented out yet.</p>
          <Button onClick={() => navigate('/agreements/new', { state: { vehicleId: vehicle.id } })}>
            Create New Agreement
          </Button>
        </div>
      )}
    </CardContent>
  );
};

export default RentalHistory;
