
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CarInstallmentContract } from '@/types/car-installment';

const contractSchema = z.object({
  car_type: z.string().min(1, 'Car type is required'),
  model_year: z.number().int().positive('Year must be a positive number'),
  number_of_cars: z.number().int().positive('Number of cars must be positive'),
  price_per_car: z.number().positive('Price per car must be positive'),
  installment_value: z.number().positive('Installment value must be positive'),
  total_installments: z.number().int().positive('Number of installments must be positive'),
});

type ContractFormData = z.infer<typeof contractSchema>;

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const ContractDialog: React.FC<ContractDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      car_type: '',
      model_year: new Date().getFullYear(),
      number_of_cars: 1,
      price_per_car: 0,
      installment_value: 0,
      total_installments: 12,
    },
  });
  
  // Calculate total contract value
  const pricePerCar = form.watch('price_per_car') || 0;
  const numberOfCars = form.watch('number_of_cars') || 0;
  const totalContractValue = pricePerCar * numberOfCars;
  
  // Calculate installment value when total value or installments change
  const totalInstallments = form.watch('total_installments') || 1;
  const calculatedInstallmentValue = totalInstallments > 0
    ? totalContractValue / totalInstallments
    : 0;
  
  // Update installment value when contract value or number of installments change
  React.useEffect(() => {
    form.setValue('installment_value', calculatedInstallmentValue);
  }, [totalContractValue, totalInstallments, form]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        car_type: '',
        model_year: new Date().getFullYear(),
        number_of_cars: 1,
        price_per_car: 0,
        installment_value: 0,
        total_installments: 12,
      });
    }
  }, [open, form]);

  const handleSubmit = (data: ContractFormData) => {
    // Convert form data to contract data with required fields for database
    const contractData: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'> = {
      car_type: data.car_type, // Ensure car_type is not optional
      model_year: data.model_year,
      number_of_cars: data.number_of_cars,
      price_per_car: data.price_per_car,
      total_installments: data.total_installments,
      installment_value: data.installment_value,
      total_contract_value: totalContractValue,
      amount_paid: 0,
      amount_pending: totalContractValue,
      remaining_installments: data.total_installments,
      overdue_payments: 0,
      category: 'car-finance' // Add the required category field
    };
    
    onSubmit(contractData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Car Installment Contract</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="car_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car Type/Model</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="number_of_cars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Cars</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_car"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Car</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="py-2">
              <div className="font-medium">Total Contract Value</div>
              <div className="text-2xl font-bold">{totalContractValue.toLocaleString()}</div>
            </div>

            <FormField
              control={form.control}
              name="total_installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Installments</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installment_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Installment Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled
                      value={calculatedInstallmentValue.toFixed(2)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Create Contract</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
