
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, ArrowLeft, Save, Trash } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehicleSchema } from '@/lib/validation-schemas/vehicle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useVehicles } from '@/hooks/use-vehicles';
import { Vehicle } from '@/types/vehicle';

const EditVehicle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { vehicles, isLoading, error, useUpdate, useDelete } = useVehicles();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  
  // Setup form with validation
  const form = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      license_plate: '',
      color: '',
      status: 'available',
      description: '',
      vin: '',
      mileage: 0,
      vehicle_type_id: '',
      rent_amount: 0
    }
  });
  
  // Find and set vehicle data when id or vehicles changes
  useEffect(() => {
    if (id && vehicles && vehicles.length > 0) {
      const foundVehicle = vehicles.find(v => v.id === id);
      if (foundVehicle) {
        setVehicle(foundVehicle);
        
        // Set form values from vehicle
        form.reset({
          make: foundVehicle.make || '',
          model: foundVehicle.model || '',
          year: foundVehicle.year || new Date().getFullYear(),
          license_plate: foundVehicle.license_plate || '',
          color: foundVehicle.color || '',
          status: foundVehicle.status || 'available',
          description: foundVehicle.description || '',
          vin: foundVehicle.vin || '',
          mileage: foundVehicle.mileage || 0,
          vehicle_type_id: foundVehicle.vehicle_type_id || '',
          rent_amount: foundVehicle.rent_amount || 0
        });
      } else {
        toast.error(`Vehicle with ID ${id} not found.`);
        navigate('/vehicles');
      }
    }
  }, [id, vehicles, form, navigate]);
  
  // Load vehicle types
  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        // Here we would fetch from API, but for now using hardcoded data
        const mockVehicleTypes = [
          { id: '1', name: 'Sedan', size: 'midsize', daily_rate: 100 },
          { id: '2', name: 'SUV', size: 'fullsize', daily_rate: 150 },
          { id: '3', name: 'Compact', size: 'compact', daily_rate: 80 },
          { id: '4', name: 'Luxury', size: 'fullsize', daily_rate: 200 },
          { id: '5', name: 'Van', size: 'fullsize', daily_rate: 180 }
        ];
        setVehicleTypes(mockVehicleTypes);
      } catch (error) {
        console.error('Error loading vehicle types:', error);
      }
    };
    
    loadVehicleTypes();
  }, []);
  
  const statusOptions = [
    { label: 'Available', value: 'available' },
    { label: 'Rented', value: 'rented' },
    { label: 'Reserved', value: 'reserved' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Police Station', value: 'police_station' },
    { label: 'Accident', value: 'accident' },
    { label: 'Stolen', value: 'stolen' },
    { label: 'Retired', value: 'retired' }
  ];
  
  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...data,
          year: Number(data.year),
          mileage: Number(data.mileage),
          rent_amount: Number(data.rent_amount)
        }
      });
      
      toast.success("Vehicle updated successfully");
      navigate('/vehicles');
    } catch (error: any) {
      toast.error(error.message || "An error occurred while updating the vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Vehicle deleted successfully");
      navigate('/vehicles');
    } catch (error: any) {
      toast.error(error.message || "An error occurred while deleting the vehicle");
    }
  };
  
  if (isLoading || !vehicle) {
    return (
      <PageContainer title="Edit Vehicle">
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer title="Edit Vehicle">
        <div className="bg-destructive/10 p-4 rounded-md">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => navigate('/vehicles')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vehicles
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Edit Vehicle" 
      description={`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`}
      backLink="/vehicles"
    >
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>
            Update details for this vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Make */}
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Model */}
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Camry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Year */}
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="2023" 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* License Plate */}
                <FormField
                  control={form.control}
                  name="license_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Color */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Silver" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* VIN */}
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input placeholder="1HGCM82633A123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Mileage */}
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="50000" 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Vehicle Type */}
                <FormField
                  control={form.control}
                  name="vehicle_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Rent Amount */}
                <FormField
                  control={form.control}
                  name="rent_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Rent Amount</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="100" 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Vehicle description..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash className="w-4 h-4 mr-2" /> Delete Vehicle
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default EditVehicle;
