
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TrafficFine } from '@/types/traffic-fine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface TrafficFinesByLicenseProps {
  licensePlate: string;
}

const TrafficFinesByLicense: React.FC<TrafficFinesByLicenseProps> = ({ licensePlate }) => {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFines = async () => {
      if (!licensePlate) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('license_plate', licensePlate)
          .order('violation_date', { ascending: false });

        if (error) throw error;

        setFines(data as TrafficFine[]);
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFines();
  }, [licensePlate]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading fines...</div>;
  }

  if (fines.length === 0) {
    return (
      <Card className="border-dashed border-muted">
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No traffic fines found for this vehicle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fines.map(fine => (
        <Card key={fine.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  Violation #{fine.violation_number || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fine.violation_date 
                    ? format(new Date(fine.violation_date), 'PPP') 
                    : 'Unknown date'} - {fine.fine_location || 'Unknown location'}
                </p>
                <p className="text-sm mt-2">{fine.violation_charge || 'Unspecified violation'}</p>
              </div>
              <div className="text-right">
                <Badge variant={fine.payment_status === 'paid' ? 'success' : 'destructive'}>
                  {fine.payment_status || 'Unpaid'}
                </Badge>
                <p className="text-sm font-bold mt-1">
                  QAR {fine.fine_amount?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TrafficFinesByLicense;
