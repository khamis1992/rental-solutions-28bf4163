import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Maintenance,
  maintenanceSchema,
  MaintenanceStatus,
  MaintenanceType
} from '@/lib/validation-schemas/maintenance';
import { useVehicles } from '@/hooks/use-vehicles';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomButton } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

// Create form schema type
type MaintenanceFormSchema = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  initialData?: Partial<Maintenance>;
  onSubmit: (data: MaintenanceFormSchema) => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  submitLabel?: string;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  isEditMode = false,
  submitLabel,
}) => {
  // Setup form with validation
  const form = useForm<MaintenanceFormSchema>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: initialData?.vehicle_id || '',
      maintenance_type: (initialData?.maintenance_type as keyof typeof MaintenanceType) || MaintenanceType.REGULAR_INSPECTION,
      status: (initialData?.status as "scheduled" | "in_progress" | "completed" | "cancelled") || MaintenanceStatus.SCHEDULED,
      scheduled_date: initialData?.scheduled_date ? new Date(initialData.scheduled_date) : new Date(),
      completion_date: initialData?.completion_date ? new Date(initialData.completion_date) : undefined,
      description: initialData?.description || '',
      cost: initialData?.cost || 0,
      service_provider: initialData?.service_provider || '',
      invoice_number: initialData?.invoice_number || '',
      odometer_reading: initialData?.odometer_reading || 0,
      notes: initialData?.notes || '',
    },
  });

  // Get vehicles for the dropdown
  const { useList } = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = useList();

  // Format the maintenance type value
  const formatMaintenanceType = (type: string) => {
    if (!type) return 'Unknown Type';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Make sure vehicles has a default value if it's undefined
  const vehiclesList = vehicles || [];

  // Filter out invalid vehicle data to prevent select errors
  const validVehicles = vehiclesList.filter(vehicle => {
    // First check if vehicle is an object
    if (!vehicle || typeof vehicle !== 'object') return false;

    // Then check for required properties using type guard
    return (
      'id' in vehicle &&
      'make' in vehicle &&
      'model' in vehicle &&
      'license_plate' in vehicle
    );
  }) as Array<{
    id: string;
    make: string;
    model: string;
    license_plate: string;
    [key: string]: any;
  }>;

  // Check if there are any vehicles available
  const hasVehicles = validVehicles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Selection */}
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={isLoadingVehicles}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hasVehicles ? (
                          validVehicles.map(vehicle => (
                            <SelectItem
                              key={vehicle.id}
                              value={vehicle.id}
                            >
                              {`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-vehicles-available">No vehicles available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Maintenance Type */}
              <FormField
                control={form.control}
                name="maintenance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || MaintenanceType.REGULAR_INSPECTION}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(MaintenanceType).map(([key, value]) => (
                          <SelectItem
                            key={key}
                            value={value}
                          >
                            {formatMaintenanceType(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      defaultValue={field.value || MaintenanceStatus.SCHEDULED}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduled Date */}
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <CustomButton
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </CustomButton>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Completion Date - only show if status is completed */}
              {form.watch('status') === 'completed' && (
                <FormField
                  control={form.control}
                  name="completion_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <CustomButton
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </CustomButton>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Cost */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Provider */}
              <FormField
                control={form.control}
                name="service_provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto Shop Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Number */}
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Odometer Reading */}
              <FormField
                control={form.control}
                name="odometer_reading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Reading (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                      placeholder="Describe the maintenance work required or performed"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information or notes"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </CustomButton>

            <CustomButton type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel || (isEditMode ? 'Update Record' : 'Create Record')}
            </CustomButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default MaintenanceForm;
