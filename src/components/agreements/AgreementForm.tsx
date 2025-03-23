
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVehicles } from '@/hooks/use-vehicles';
import { useCustomers } from '@/hooks/use-customers';
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface AgreementFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  standardTemplateExists: boolean;
  isCheckingTemplate: boolean;
}

const AgreementForm: React.FC<AgreementFormProps> = ({ 
  onSubmit, 
  isSubmitting, 
  standardTemplateExists,
  isCheckingTemplate 
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 7)));
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  
  // Fix the way we use the useVehicles hook
  const vehiclesHook = useVehicles();
  const { data: vehicles, isLoading: isLoadingVehicles } = vehiclesHook.useList();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  
  useEffect(() => {
    if (selectedVehicle) {
      setTotalAmount(selectedVehicle.rent_amount || 0);
      setRentAmount(selectedVehicle.rent_amount || 0);
    }
  }, [selectedVehicle]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the data for submission, ensuring we're not sending nested objects
    // that might not match the database schema
    const formData = {
      customer_id: selectedCustomer?.id || '',
      vehicle_id: selectedVehicle?.id || '',
      start_date: startDate,
      end_date: endDate,
      status: 'pending_payment',
      total_amount: totalAmount,
      agreement_number: `AGR-${Date.now().toString().substring(7)}`,
      // Add any other fields needed for the leases table, but don't include nested customer_data or vehicle_data
      // that doesn't exist in the database schema
      rent_amount: rentAmount,
      notes: notes,
      terms_accepted: termsAccepted,
    };
    
    // Submit the processed data to the parent component
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {!standardTemplateExists && !isCheckingTemplate && <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Agreement template not found. Please upload a template file to enable agreement creation.
          </AlertDescription>
        </Alert>}
      
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer">Customer</Label>
            <Select onValueChange={(value) => {
              const customer = customers?.find((c) => c.id === value);
              setSelectedCustomer(customer);
            }} disabled={isLoadingCustomers}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="vehicle">Vehicle</Label>
            <Select onValueChange={(value) => {
              const vehicle = vehicles?.find((v) => v.id === value);
              setSelectedVehicle(vehicle);
            }} disabled={isLoadingVehicles}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) =>
                    date < new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date < new Date() || (startDate && date < startDate)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rentAmount">Rent Amount</Label>
            <Input
              type="number"
              id="rentAmount"
              value={rentAmount}
              onChange={(e) => setRentAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="totalAmount">Total Amount</Label>
            <Input
              type="number"
              id="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes or comments"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
          />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
        <Button type="submit" disabled={isSubmitting || isCheckingTemplate || !standardTemplateExists}>
          {isSubmitting ? "Creating..." : "Create Agreement"}
        </Button>
      </div>
    </form>
  );
};

export default AgreementForm;
