
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAgreements } from '@/hooks/use-agreements';
import { formatDate } from '@/lib/date-utils';

const VehicleDetail = ({ vehicleId }: { vehicleId: string }) => {
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAgreement } = useAgreements();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!vehicleId) {
          throw new Error("Invalid vehicle ID");
        }
    
        if (getAgreement) {
          const agreementData = await getAgreement(vehicleId);
          setAgreement(agreementData);
        } else {
          setError("Agreement not found for this vehicle.");
        }
      } catch (err) {
        console.error('Error fetching agreement:', err);
        setError('Failed to load agreement details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId, getAgreement]);

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Loading vehicle details...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!agreement) {
    return <div className="py-4 text-center text-muted-foreground">No agreement found for this vehicle.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agreement Details</CardTitle>
          <CardDescription>
            Details about the agreement associated with this vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Agreement Number</h4>
              <p>{agreement.agreement_number}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Status</h4>
              <Badge variant="secondary">{agreement.status}</Badge>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Start Date</h4>
              <p>{formatDate(new Date(agreement.start_date))}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">End Date</h4>
              <p>{formatDate(new Date(agreement.end_date))}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Rent Amount</h4>
              <p>{agreement.rent_amount}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Total Amount</h4>
              <p>{agreement.total_amount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleDetail;
