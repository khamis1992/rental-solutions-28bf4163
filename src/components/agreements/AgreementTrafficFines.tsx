
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrafficFineStatusType } from "@/hooks/use-traffic-fines";

type TrafficFine = {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: string;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: TrafficFineStatusType;
  location?: string;
  lease_id?: string;
};

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500 text-white border-green-600";
    case "disputed":
      return "bg-amber-500 text-white border-amber-600";
    case "pending":
    default:
      return "bg-red-500 text-white border-red-600";
  }
};

export const AgreementTrafficFines = ({ 
  agreementId, 
  startDate,
  endDate 
}: AgreementTrafficFinesProps) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      setIsLoading(true);
      
      try {
        // First try to get directly related fines
        let { data: relatedFines, error: relatedError } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('lease_id', agreementId);

        if (relatedError) {
          console.error("Error fetching related traffic fines:", relatedError);
        }

        // Then get fines by date range for the same vehicle
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('leases')
          .select('vehicle_id')
          .eq('id', agreementId)
          .single();

        if (vehicleError) {
          console.error("Error fetching vehicle info:", vehicleError);
          setTrafficFines(relatedFines || []);
          setIsLoading(false);
          return;
        }

        if (vehicleData) {
          const { data: dateRangeFines, error: dateRangeError } = await supabase
            .from('traffic_fines')
            .select('*')
            .eq('vehicle_id', vehicleData.vehicle_id)
            .gte('violationDate', startDate.toISOString())
            .lte('violationDate', endDate.toISOString())
            .is('lease_id', null); // Only get unassigned fines

          if (dateRangeError) {
            console.error("Error fetching date range traffic fines:", dateRangeError);
          } else if (dateRangeFines) {
            // Combine both sets of fines, ensuring no duplicates
            const allFines = [...(relatedFines || [])];
            
            dateRangeFines.forEach(fine => {
              if (!allFines.some(f => f.id === fine.id)) {
                allFines.push(fine);
              }
            });
            
            setTrafficFines(allFines);
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching traffic fines:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [agreementId, startDate, endDate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>Loading traffic violations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
        <CardDescription>
          Violations during the rental period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trafficFines.length > 0 ? (
          <div className="space-y-4">
            {trafficFines.map((fine) => (
              <div 
                key={fine.id} 
                className="flex flex-col sm:flex-row justify-between p-4 border rounded-md"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">Violation #{fine.violationNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(fine.violationDate), "PPP")}
                    {fine.location && ` at ${fine.location}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{fine.violationCharge}</p>
                </div>
                <div className="flex flex-col sm:items-end mt-2 sm:mt-0">
                  <p className="font-bold">{formatCurrency(fine.fineAmount)}</p>
                  <Badge className={`${getStatusColor(fine.paymentStatus)} mt-1`}>
                    {fine.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-6 text-muted-foreground">
            No traffic fines recorded for this rental period.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
