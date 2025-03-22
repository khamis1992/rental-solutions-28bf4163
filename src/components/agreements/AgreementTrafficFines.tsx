
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus, AlertTriangle } from "lucide-react";
import { TrafficFineStatusType, useTrafficFines } from "@/hooks/use-traffic-fines";
import { useToast } from "@/hooks/use-toast";

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
      return "bg-green-500";
    case "disputed":
      return "bg-amber-500";
    case "pending":
    default:
      return "bg-red-500";
  }
};

export const AgreementTrafficFines = ({ 
  agreementId, 
  startDate,
  endDate 
}: AgreementTrafficFinesProps) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [unassignedFines, setUnassignedFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const { toast } = useToast();
  const { assignToAgreement } = useTrafficFines();

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
            .gte('violation_date', startDate.toISOString())
            .lte('violation_date', endDate.toISOString())
            .is('lease_id', null); // Only get unassigned fines

          if (dateRangeError) {
            console.error("Error fetching date range traffic fines:", dateRangeError);
          } else if (dateRangeFines) {
            // Set unassigned fines that could be assigned to this agreement
            setUnassignedFines(dateRangeFines);
            
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

  const handleAssignFine = (fineId: string) => {
    assignToAgreement({ id: fineId, leaseId: agreementId });
    
    // Update UI to reflect the assignment
    setUnassignedFines(prev => prev.filter(fine => fine.id !== fineId));
    
    // Update the fines list to show the assignment
    setTrafficFines(prev => 
      prev.map(fine => 
        fine.id === fineId 
          ? { ...fine, lease_id: agreementId } 
          : fine
      )
    );
  };
  
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Traffic Fines</CardTitle>
          <CardDescription>
            Violations during the rental period
          </CardDescription>
        </div>
        {unassignedFines.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowUnassigned(!showUnassigned)}
          >
            {showUnassigned ? "Hide Unassigned" : `Show Unassigned (${unassignedFines.length})`}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showUnassigned && unassignedFines.length > 0 && (
          <div className="mb-6 border rounded-md p-4 bg-muted/20">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
              Unassigned Traffic Fines
            </h3>
            <div className="space-y-3">
              {unassignedFines.map((fine) => (
                <div 
                  key={`unassigned-${fine.id}`} 
                  className="flex flex-col sm:flex-row justify-between p-3 border rounded-md bg-background"
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
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="mt-1"
                      onClick={() => handleAssignFine(fine.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Assign to Agreement
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {trafficFines.filter(fine => fine.lease_id === agreementId).length > 0 ? (
          <div className="space-y-4">
            {trafficFines
              .filter(fine => fine.lease_id === agreementId)
              .map((fine) => (
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
            No traffic fines assigned to this rental agreement.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
