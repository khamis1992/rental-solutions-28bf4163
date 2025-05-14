
import React from 'react';
import { useTrafficFineAdapter } from '@/hooks/adapters/use-traffic-fine-adapter';
import TrafficFineAnalytics from '@/components/fines/TrafficFineAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AgreementTrafficFineAnalyticsProps {
  agreementId: string;
}

export function AgreementTrafficFineAnalytics({ agreementId }: AgreementTrafficFineAnalyticsProps) {
  const { trafficFines: fines, isLoading, error } = useTrafficFineAdapter(undefined, agreementId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-destructive">
            <p>Failed to load traffic fine analytics</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fines || fines.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            <p>No traffic fines found for this agreement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <TrafficFineAnalytics />;
}

export default AgreementTrafficFineAnalytics;
