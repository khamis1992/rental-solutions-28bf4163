
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrafficFineStatusType } from "@/hooks/use-traffic-fines";
import { toast } from "sonner";

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
  vehicle_id?: string;
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
        // Get the vehicle ID associated with this agreement using a subquery approach
        // Include table name alias to avoid ambiguous column references
        const { data: leaseData, error: leaseError } = await supabase
          .from('leases as l')
          .select('l.vehicle_id')
          .filter('l.id', 'eq', agreementId)
          .single();
        
        if (leaseError) {
          console.error("Error fetching lease info:", leaseError);
          setIsLoading(false);
          return;
        }

        if (!leaseData?.vehicle_id) {
          console.error("No vehicle associated with this agreement");
          setIsLoading(false);
          return;
        }

        // Fetch traffic fines that are directly associated with this agreement
        const { data: directFines, error: directError } = await supabase
          .from('traffic_fines as tf')
          .select('tf.*')
          .filter('tf.lease_id', 'eq', agreementId);

        if (directError) {
          console.error("Error fetching direct traffic fines:", directError);
        }

        // Fetch traffic fines for the vehicle during the rental period
        // Use table alias to avoid ambiguous column references
        const { data: dateRangeFines, error: dateRangeError } = await supabase
          .from('traffic_fines as tf')
          .select('tf.*')
          .filter('tf.vehicle_id', 'eq', leaseData.vehicle_id)
          .gte('tf.violation_date', startDate.toISOString())
          .lte('tf.violation_date', endDate.toISOString());

        if (dateRangeError) {
          console.error("Error fetching date range traffic fines:", dateRangeError);
          toast.error("Failed to load traffic fines data");
          setIsLoading(false);
          return;
        }

        // Combine both sets and remove duplicates
        let allFines: TrafficFine[] = [];
        
        if (directFines && directFines.length > 0) {
          // Transform data from snake_case to camelCase
          allFines = directFines.map(fine => ({
            id: fine.id,
            violationNumber: fine.violation_number,
            licensePlate: fine.license_plate,
            violationDate: fine.violation_date,
            fineAmount: fine.fine_amount,
            violationCharge: fine.violation_charge,
            paymentStatus: fine.payment_status,
            location: fine.fine_location,
            lease_id: fine.lease_id,
            vehicle_id: fine.vehicle_id
          }));
        }
        
        if (dateRangeFines && dateRangeFines.length > 0) {
          // Transform data from snake_case to camelCase
          const transformedDateRangeFines = dateRangeFines.map(fine => ({
            id: fine.id,
            violationNumber: fine.violation_number,
            licensePlate: fine.license_plate,
            violationDate: fine.violation_date,
            fineAmount: fine.fine_amount,
            violationCharge: fine.violation_charge,
            paymentStatus: fine.payment_status,
            location: fine.fine_location,
            lease_id: fine.lease_id,
            vehicle_id: fine.vehicle_id
          }));
          
          transformedDateRangeFines.forEach(fine => {
            if (!allFines.some(f => f.id === fine.id)) {
              allFines.push(fine);
            }
          });
        }

        // Check if any fines were found
        console.log("All traffic fines found:", allFines);
        setTrafficFines(allFines);
      } catch (error) {
        console.error("Unexpected error fetching traffic fines:", error);
        toast.error("An error occurred while loading traffic fines");
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
}
