
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { TrafficFine } from '@/types/traffic-fine';

interface TrafficFinesByLicenseProps {
  licensePlate: string;
}

const TrafficFinesByLicense = ({ licensePlate }: TrafficFinesByLicenseProps) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (licensePlate) {
      fetchTrafficFines();
    }
  }, [licensePlate]);

  const fetchTrafficFines = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('license_plate', licensePlate);

      if (error) {
        throw error;
      }

      setFines(data || []);
    } catch (err) {
      console.error('Error fetching traffic fines:', err);
      setError('Failed to load traffic fines');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={fetchTrafficFines}>
          Retry
        </Button>
      </div>
    );
  }

  if (fines.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No traffic fines found for license plate {licensePlate}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines for {licensePlate}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Violation #</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{fine.violation_number || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {fine.violation_date
                      ? new Date(fine.violation_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2">{fine.fine_location || 'N/A'}</td>
                  <td className="px-4 py-2">
                    {typeof fine.fine_amount === 'number'
                      ? formatCurrency(fine.fine_amount)
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    <Badge
                      variant={
                        fine.payment_status === 'paid'
                          ? 'success'
                          : fine.payment_status === 'disputed'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {fine.payment_status || 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficFinesByLicense;
