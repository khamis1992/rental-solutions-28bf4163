
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, CheckCircle, User, Car } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Vehicle } from '@/types/vehicle';

interface ReassignmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  agreementId: string;
  currentVehicle: Vehicle;
  onReassignComplete: () => void;
}

interface PendingPayment {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
}

const ReassignmentWizard = ({
  isOpen,
  onClose,
  agreementId,
  currentVehicle,
  onReassignComplete
}: ReassignmentWizardProps) => {
  const [step, setStep] = useState<'warning' | 'vehicle-selection' | 'confirmation'>('warning');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [pendingPayments] = useState<PendingPayment[]>([
    {
      id: '1',
      amount: 500,
      dueDate: '2024-01-15',
      description: 'Monthly rent payment'
    }
  ]);
  const [isReassigning, setIsReassigning] = useState(false);

  // Mock data for available vehicles
  useEffect(() => {
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        license_plate: 'ABC-123',
        color: 'Silver',
        status: 'available'
      },
      {
        id: '2',
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        license_plate: 'XYZ-789',
        color: 'Blue',
        status: 'available'
      }
    ];
    setAvailableVehicles(mockVehicles);
  }, []);

  const filteredVehicles = availableVehicles.filter(vehicle =>
    vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep('confirmation');
  };

  const handleReassign = async () => {
    if (!selectedVehicle) return;

    setIsReassigning(true);
    try {
      // Implement reassignment logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      onReassignComplete();
      onClose();
    } catch (error) {
      console.error('Reassignment failed:', error);
    } finally {
      setIsReassigning(false);
    }
  };

  const resetWizard = () => {
    setStep('warning');
    setSelectedVehicle(null);
    setSearchTerm('');
    setIsReassigning(false);
  };

  const handleClose = () => {
    if (!isReassigning) {
      resetWizard();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Reassign Vehicle
          </DialogTitle>
        </DialogHeader>

        {step === 'warning' && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to reassign this agreement from the current vehicle to a different vehicle.
                This action will affect payment schedules and vehicle availability.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Car className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{currentVehicle.make} {currentVehicle.model}</p>
                    <p className="text-sm text-gray-500">
                      {currentVehicle.year} • {currentVehicle.license_plate} • {currentVehicle.color}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {pendingPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingPayments.map(payment => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-gray-500">Due: {payment.dueDate}</p>
                        </div>
                        <Badge variant="outline">${payment.amount}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep('vehicle-selection')}>
                Continue to Vehicle Selection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'vehicle-selection' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="vehicle-search">Search Available Vehicles</Label>
              <Input
                id="vehicle-search"
                type="text"
                placeholder="Search by make, model, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-4 space-y-3">
                {filteredVehicles.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No available vehicles found
                  </p>
                ) : (
                  filteredVehicles.map(vehicle => (
                    <Card
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Car className="h-6 w-6 text-gray-400" />
                            <div>
                              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-sm text-gray-500">
                                {vehicle.year} • {vehicle.license_plate} • {vehicle.color}
                              </p>
                            </div>
                          </div>
                          <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                            {vehicle.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('warning')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 'confirmation' && selectedVehicle && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Please confirm the vehicle reassignment details below.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">From</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Car className="h-6 w-6 text-red-500" />
                    <div>
                      <p className="font-medium">{currentVehicle.make} {currentVehicle.model}</p>
                      <p className="text-sm text-gray-500">{currentVehicle.license_plate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">To</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Car className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</p>
                      <p className="text-sm text-gray-500">{selectedVehicle.license_plate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('vehicle-selection')}>
                Back
              </Button>
              <Button onClick={handleReassign} disabled={isReassigning}>
                {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReassignmentWizard;
