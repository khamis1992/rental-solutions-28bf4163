
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CarInstallmentContract } from '@/types/car-installment';

const contractSchema = z.object({
  car_type: z.string().min(1, 'Car type is required'),
  model_year: z.coerce.number().min(2000, 'Year must be 2000 or later').max(2050, 'Year must be 2050 or earlier'),
  number_of_cars: z.coerce.number().min(1, 'Number of cars must be at least 1'),
  price_per_car: z.coerce.number().min(1, 'Price per car must be greater than 0'),
  total_contract_value: z.coerce.number().min(1, 'Total contract value must be greater than 0'),
  total_installments: z.coerce.number().min(1, 'Number of installments must be at least 1'),
  installment_value: z.coerce.number().min(1, 'Installment value must be greater than 0'),
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
      total_contract_value: 0,
      total_installments: 1,
      installment_value: 0,
    },
  });

  // Calculate values when input changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'price_per_car' || name === 'number_of_cars') {
        const price = parseFloat(value.price_per_car?.toString() || '0');
        const cars = parseInt(value.number_of_cars?.toString() || '0');
        if (!isNaN(price) && !isNaN(cars)) {
          form.setValue('total_contract_value', price * cars);
        }
      }

      if (name === 'total_contract_value' || name === 'total_installments') {
        const total = parseFloat(value.total_contract_value?.toString() || '0');
        const installments = parseInt(value.total_installments?.toString() || '0');
        if (!isNaN(total) && !isNaN(installments) && installments > 0) {
          form.setValue('installment_value', total / installments);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (data: ContractFormData) => {
    onSubmit({
      ...data,
      amount_paid: 0,
      amount_pending: data.total_contract_value,
      remaining_installments: data.total_installments,
      overdue_payments: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                  <FormLabel>Car Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Toyota Camry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Year</FormLabel>
                    <FormControl>
                      <Input type="number" min={2000} max={2050} {...field} />
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
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="price_per_car"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Car</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.01} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="total_contract_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Contract Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      step={0.01} 
                      {...field}
                      className="bg-muted" 
                      readOnly 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Installments</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
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
                        min={0} 
                        step={0.01} 
                        {...field} 
                        className="bg-muted"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Contract</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
