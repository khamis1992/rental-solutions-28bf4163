import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useVehicles } from '@/hooks/use-vehicles';
import { 
  asLeaseId, 
  asVehicleId, 
  LeaseId, 
  VehicleId, 
  asLeaseStatus, 
  asPaymentStatus 
} from '@/types/database-common';
import { LeaseRow } from '@/types/database-common';

interface ReassignmentWizardProps {
  leaseId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const ReassignmentWizard: React.FC<ReassignmentWizardProps> = ({ leaseId, onComplete, onCancel }) => {
  const [lease, setLease] = useState<{
    id: LeaseId | null;
    agreement_number: string | null;
    status: string | null;
    customer_id: string | null;
    vehicle_id: string | null;
    start_date: string | null;
    end_date: string | null;
    customerName: string | null;
  }>({
    id: null,
    agreement_number: null,
    status: null,
    customer_id: null,
    vehicle_id: null,
    start_date: null,
    end_date: null,
    customerName: null,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<{
    id: VehicleId | null;
    make: string | null;
    model: string | null;
    license_plate: string | null;
  }>({
    id: null,
    make: null,
    model: null,
    license_plate: null,
  });
  const navigate = useNavigate();

  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  const fetchLeaseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id, agreement_number, status, customer_id, vehicle_id, start_date, end_date,
          profiles:customer_id (id, full_name, email, phone_number)
        `)
        .eq('id', asLeaseId(leaseId))
        .single();

      if (error) {
        console.error('Error fetching lease details:', error);
        toast.error('Failed to fetch agreement details');
        return;
      }

      if (data) {
        const leaseData = data as LeaseRow & { profiles: any[] };
        setLease({
          ...leaseData,
          customerName: leaseData.profiles?.[0]?.full_name || 'Unknown Customer'
        });
      }
    } catch (error) {
      console.error('Error in fetch lease details:', error);
      toast.error('Failed to load agreement data');
    }
  };

  const fetchCurrentVehicle = async () => {
    if (!lease.vehicle_id) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate')
        .eq('id', lease.vehicle_id)
        .single();

      if (error) {
        console.error('Error fetching current vehicle:', error);
        toast.error('Failed to fetch current vehicle details');
        return;
      }

      if (data) {
        setCurrentVehicle({
          id: asVehicleId(data.id),
          make: data.make,
          model: data.model,
          license_plate: data.license_plate,
        });
      }
    } catch (error) {
      console.error('Error in fetch current vehicle:', error);
      toast.error('Failed to load current vehicle data');
    }
  };

  useEffect(() => {
    fetchLeaseDetails();
    fetchCurrentVehicle();
  }, [leaseId]);

  const availableVehicles = vehicles?.filter(
    (vehicle) => vehicle.id !== currentVehicle.id
  ) || [];

  const handleVehicleSelect = (vehicleId: VehicleId) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleCancelReassignment = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/agreements');
    }
  };

  const handleConfirmReassignment = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id, agreement_number, status, customer_id, vehicle_id, start_date, end_date,
          profiles:customer_id (id, full_name, email, phone_number)
        `)
        .eq('id', asLeaseId(leaseId))
        .single();

      if (error) {
        console.error('Error fetching lease details:', error);
        toast.error('Failed to fetch agreement details');
        return;
      }

      if (data) {
        const leaseData = data as LeaseRow & { profiles: any[] };
        
        const updates = {
          vehicle_id: selectedVehicleId,
        };

        const { error: updateError } = await supabase
          .from('leases')
          .update(updates)
          .eq('id', asLeaseId(leaseId));

        if (updateError) {
          console.error('Error updating lease with new vehicle:', updateError);
          toast.error('Failed to update lease with new vehicle');
          return;
        }

        toast.success('Vehicle reassigned successfully!');
        if (onComplete) {
          onComplete();
        } else {
          navigate('/agreements');
        }
      }
    } catch (error) {
      console.error('Error in handleConfirmReassignment:', error);
      toast.error('Failed to reassign vehicle');
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
            <div className="space-y-2">
              <Label>Agreement Number</Label>
              <p>{lease.agreement_number}</p>
            </div>
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <p>{lease.customerName}</p>
            </div>
            <div className="space-y-2">
              <Label>Current Vehicle</Label>
              <p>
                {currentVehicle.make} {currentVehicle.model} ({currentVehicle.license_plate})
              </p>
            </div>
            <div className="space-y-2">
              <Label>Select New Vehicle</Label>
              <Select onValueChange={handleVehicleSelect}>
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
              <Button onClick={handleConfirmReassignment} disabled={!selectedVehicleId}>
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
