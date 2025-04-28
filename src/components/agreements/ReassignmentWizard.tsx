
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useLeaseReassignment } from '@/hooks/use-lease-reassignment';
import { ReassignmentDetails } from './reassignment/ReassignmentDetails';
import type { ReassignmentWizardProps } from '@/types/reassignment.types';

const ReassignmentWizard: React.FC<ReassignmentWizardProps> = ({ 
  leaseId, 
  onComplete, 
  onCancel 
}) => {
  const navigate = useNavigate();
  const {
    lease,
    currentVehicle,
    selectedVehicleId,
    setSelectedVehicleId,
    handleConfirmReassignment,
    availableVehicles
  } = useLeaseReassignment(leaseId);

  const handleCancelReassignment = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/agreements');
    }
  };

  const handleConfirm = async () => {
    const success = await handleConfirmReassignment();
    if (success) {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/agreements');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reassign Vehicle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lease.id ? (
          <>
            <ReassignmentDetails 
              agreementNumber={lease.agreement_number}
              customerName={lease.customerName}
              currentVehicle={currentVehicle}
            />
            <div className="space-y-2">
              <Label>Select New Vehicle</Label>
              <Select onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelReassignment}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedVehicleId}>
                Confirm Reassignment
              </Button>
            </div>
          </>
        ) : (
          <p>Loading agreement details...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReassignmentWizard;
