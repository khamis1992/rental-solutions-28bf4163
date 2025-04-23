
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VehicleStatus } from '@/types/vehicle';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: VehicleStatus;
  vehicleId: string;
  vehicleDetails: {
    make: string;
    model: string;
    licensePlate: string;
  };
  onStatusUpdated: () => Promise<boolean>;
}

const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  currentStatus,
  vehicleId,
  vehicleDetails,
  onStatusUpdated
}) => {
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>(currentStatus);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
      setNotes('');
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const success = await onStatusUpdated();
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Vehicle Status</DialogTitle>
          <DialogDescription>
            Change the status for {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.licensePlate})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="status" className="text-right text-sm font-medium">
              Current Status
            </label>
            <div className="col-span-3">
              <span className="text-sm font-medium">{currentStatus}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="new-status" className="text-right text-sm font-medium">
              New Status
            </label>
            <div className="col-span-3">
              <Select 
                value={selectedStatus} 
                onValueChange={(value) => setSelectedStatus(value as VehicleStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="police_station">Police Station</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="stolen">Stolen</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <label htmlFor="notes" className="text-right text-sm font-medium pt-2">
              Notes
            </label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this status change"
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || currentStatus === selectedStatus}
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;
