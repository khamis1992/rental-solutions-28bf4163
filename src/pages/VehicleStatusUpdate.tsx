
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, RefreshCw } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { VehicleStatus } from '@/types/vehicle';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VehicleListView from '@/components/vehicles/VehicleListView';

const VehicleStatusUpdate = () => {
  const navigate = useNavigate();
  const { useList, useUpdate } = useVehicles();
  const { data: vehicles = [], isLoading } = useList();
  const { mutate: updateVehicle, isPending: isUpdating } = useUpdate();
  
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newStatus, setNewStatus] = useState<VehicleStatus>('available');
  const [notes, setNotes] = useState('');
  
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  const handleStatusUpdate = async () => {
    if (!selectedVehicleId || !newStatus) {
      toast.error('Please select a vehicle and status');
      return;
    }

    try {
      await updateVehicle(
        { 
          id: selectedVehicleId, 
          data: { 
            status: newStatus,
            // You might want to store notes in a separate table
          } 
        },
        {
          onSuccess: () => {
            toast.success(`Vehicle status updated to ${newStatus}`);
            setSelectedVehicleId('');
            setNewStatus('available');
            setNotes('');
          },
          onError: (error) => {
            toast.error('Failed to update vehicle status', {
              description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
          }
        }
      );
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="Vehicle Status Update"
          description="Change the status of vehicles in your fleet"
          icon={RefreshCw}
          actions={
            <Button 
              variant="outline" 
              onClick={() => navigate('/vehicles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Button>
          }
        />

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto pr-2">
                <VehicleListView
                  vehicles={vehicles}
                  isLoading={isLoading}
                  onSelectVehicle={(id) => setSelectedVehicleId(id)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVehicle ? (
                <div className="space-y-6">
                  <div>
                    <div className="text-xl font-bold">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedVehicle.year} • {selectedVehicle.license_plate}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                    <div className="font-medium">
                      {selectedVehicle.status || 'Available'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-status">New Status</Label>
                    <Select 
                      value={newStatus} 
                      onValueChange={(value) => setNewStatus(value as VehicleStatus)}
                    >
                      <SelectTrigger id="new-status">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any additional notes about this status change"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || selectedVehicle.status === newStatus}
                  >
                    {isUpdating ? 'Updating...' : 'Update Vehicle Status'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                  <Car className="h-16 w-16 mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold mb-1">No Vehicle Selected</h3>
                  <p>Please select a vehicle from the list to update its status.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default VehicleStatusUpdate;
