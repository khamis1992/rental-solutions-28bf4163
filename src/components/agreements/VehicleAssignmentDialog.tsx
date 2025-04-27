
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  asVehicleId,
  safelyExtractFields
} from '@/utils/database-type-helpers';

// Define Payment interface directly here to avoid import issues
interface Payment {
  id: string;
  amount: number;
  status: string;
  description?: string | null;
  payment_date?: Date | string | null;
  due_date?: Date | string | null;
  lease_id?: string;
  payment_method?: string | null;
  balance?: number;
  amount_paid?: number;
  late_fine_amount?: number;
  days_overdue?: number;
}

// Define a type for vehicle information
interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  color: string | null;
}

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleId: string;
  existingAgreement: {
    id: string;
    agreement_number: string;
  };
}

export function VehicleAssignmentDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleId,
  existingAgreement
}: VehicleAssignmentDialogProps) {
  const [vehicleDetails, setVehicleDetails] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, make, model, license_plate, year, color')
          .eq('id', asVehicleId(vehicleId))
          .single();
        
        if (error) throw error;
        
        const vehicleInfo = safelyExtractFields<VehicleInfo>(
          data,
          {
            id: '',
            make: '',
            model: '',
            license_plate: '',
            year: 0,
            color: null
          },
          ['id', 'make', 'model', 'license_plate', 'year']
        );
        
        setVehicleDetails(vehicleInfo);
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && vehicleId) {
      fetchVehicleDetails();
    }
  }, [isOpen, vehicleId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vehicle Assignment Conflict</DialogTitle>
          <DialogDescription>
            This vehicle is already assigned to another agreement. 
            Would you like to terminate the existing agreement?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-medium mb-2">Existing Agreement</h3>
          <p>Agreement Number: {existingAgreement.agreement_number}</p>
          
          {vehicleDetails && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Vehicle Details</h3>
              <p>
                {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})
              </p>
              <p>
                License Plate: {vehicleDetails.license_plate}
              </p>
              {vehicleDetails.color && <p>Color: {vehicleDetails.color}</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>
            Terminate Existing Agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
