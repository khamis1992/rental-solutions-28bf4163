import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { VehicleStatus } from '@/types/vehicle';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { Loader2 } from 'lucide-react';
import { useLicensePlateChangeHandler } from '@/hooks/traffic-fines/use-license-plate-change-handler';
import { toast } from 'sonner';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('vehicle-form');

interface VehicleFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const VehicleForm = ({ 
  initialData, 
  onSubmit, 
  isLoading = false, 
  isEditMode = false 
}: VehicleFormProps) => {
  const [make, setMake] = useState(initialData?.make || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [year, setYear] = useState(initialData?.year?.toString() || '');
  const [licensePlate, setLicensePlate] = useState(initialData?.license_plate || initialData?.licensePlate || '');
  const [vin, setVin] = useState(initialData?.vin || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [mileage, setMileage] = useState(initialData?.mileage?.toString() || '');
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus>(initialData?.status || 'available');
  const [description, setDescription] = useState(initialData?.description || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [insuranceCompany, setInsuranceCompany] = useState(initialData?.insurance_company || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState<Date | undefined>(initialData?.insurance_expiry ? new Date(initialData.insurance_expiry) : undefined);
  const [rentAmount, setRentAmount] = useState(initialData?.rent_amount?.toString() || '');
  const [vehicleType, setVehicleType] = useState(initialData?.vehicle_type_id || '');
  const { vehicleTypes, isLoading: isLoadingVehicleTypes } = useVehicleTypes();
  const { toast } = useToast();
  
  const [oldLicensePlate, setOldLicensePlate] = useState<string | null>(null);
  const [licensePlateChanged, setLicensePlateChanged] = useState(false);
  const { handleLicensePlateChange, isProcessing } = useLicensePlateChangeHandler();

  // Store the initial license plate when in edit mode
  useEffect(() => {
    if (isEditMode && initialData?.license_plate) {
      setOldLicensePlate(initialData.license_plate);
    }
  }, [isEditMode, initialData]);

  // Check if license plate has been changed
  const checkLicensePlateChange = (formData: any) => {
    if (isEditMode && oldLicensePlate && formData.license_plate !== oldLicensePlate) {
      setLicensePlateChanged(true);
      logger.info(`License plate changed: ${oldLicensePlate} → ${formData.license_plate}`);
      return true;
    }
    return false;
  };

  // Handle form submission with license plate change detection
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!make || !model || !year || !licensePlate || !vin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    // Create form data from state
    const formData = {
      make: make || '',
      model: model || '',
      year: parseInt(year || '0', 10),
      license_plate: licensePlate || '',
      vin: vin || '',
      color: color || undefined,
      mileage: mileage ? parseInt(mileage, 10) : undefined,
      status: vehicleStatus || undefined,
      description: description || undefined,
      location: location || undefined,
      insurance_company: insuranceCompany || undefined,
      insurance_expiry: insuranceExpiry || undefined,
      rent_amount: rentAmount ? parseFloat(rentAmount) : undefined,
      vehicle_type_id: vehicleType || undefined,
    };
    
    try {
      // Check if license plate changed
      const plateChanged = checkLicensePlateChange(formData);
      
      // Submit the vehicle form data
      await onSubmit(formData);
      
      // If license plate was changed and we have a vehicle ID, handle fine reassignment
      if (plateChanged && initialData?.id) {
        logger.info(`Handling fine reassignment for vehicle ${initialData.id}`);
        
        const result = await handleLicensePlateChange({
          oldLicensePlate: oldLicensePlate!,
          newLicensePlate: formData.license_plate,
          vehicleId: initialData.id
        });
        
        if (result.finesUpdated > 0) {
          logger.info(`Successfully updated ${result.finesUpdated} traffic fines`);
        } else if (result.totalFines > 0 && result.finesUpdated === 0) {
          toast.warning('Failed to update associated traffic fines', {
            description: 'The vehicle was updated, but there were issues reassigning traffic fines'
          });
        }
      }
    } catch (error) {
      logger.error('Error submitting form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div>
        <Label htmlFor="make">Make</Label>
        <Input
          type="text"
          id="make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="model">Model</Label>
        <Input
          type="text"
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="year">Year</Label>
        <Input
          type="number"
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="licensePlate">License Plate</Label>
        <Input
          type="text"
          id="licensePlate"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="vin">VIN</Label>
        <Input
          type="text"
          id="vin"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          type="text"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="mileage">Mileage</Label>
        <Input
          type="number"
          id="mileage"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={vehicleStatus} onValueChange={(value) => setVehicleStatus(value as VehicleStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a status" />
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
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="insuranceCompany">Insurance Company</Label>
        <Input
          type="text"
          id="insuranceCompany"
          value={insuranceCompany}
          onChange={(e) => setInsuranceCompany(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !insuranceExpiry && "text-muted-foreground"
              )}
            >
              {insuranceExpiry ? format(insuranceExpiry, "PPP") : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              selected={insuranceExpiry}
              onSelect={setInsuranceExpiry}
              disabled={(date) =>
                date < new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="rentAmount">Rent Amount</Label>
        <Input
          type="number"
          id="rentAmount"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="vehicleType">Vehicle Type</Label>
        <Select value={vehicleType} onValueChange={setVehicleType} disabled={isLoadingVehicleTypes}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {vehicleTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-4 mt-6">
        {/* Show notice about traffic fine updates if license plate changed */}
        {licensePlateChanged && (
          <div className="text-sm text-amber-600 mr-auto">
            Associated traffic fines will be updated with the new license plate.
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={isLoading || isProcessing}
        >
          {(isLoading || isProcessing) && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {isEditMode ? 'Update Vehicle' : 'Create Vehicle'}
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm;
