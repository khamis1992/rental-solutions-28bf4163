
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTrafficFineValidation } from '@/hooks/validation/use-traffic-fine-validation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry = ({ onFineSaved }: TrafficFineEntryProps) => {
  const { toast } = useToast();
  const validation = useTrafficFineValidation();

  // Create the traffic fine
  const createFineMutation = useMutation({
    mutationFn: async (data: any) => {
      // First validate everything
      if (!validation.validateAll()) {
        throw new Error('Validation failed');
      }
      
      // Transform dates to ISO string format for DB
      const violationDate = data.violationDate instanceof Date 
        ? data.violationDate.toISOString() 
        : data.violationDate;
      
      // Create payload for database
      const fineData = {
        violation_number: data.violationNumber,
        license_plate: data.licensePlate?.trim(),
        violation_date: violationDate,
        fine_amount: parseFloat(data.fineAmount),
        violation_charge: data.violationCharge,
        fine_location: data.location,
        payment_status: 'pending',
        assignment_status: 'pending' 
      };
      
      const { data: result, error } = await supabase
        .from('traffic_fines')
        .insert(fineData)
        .select('*')
        .single();
        
      if (error) {
        throw new Error(`Failed to create traffic fine: ${error.message}`);
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Fine recorded successfully',
        description: 'The traffic fine has been added to the system'
      });
      validation.resetForm();
      if (onFineSaved) {
        onFineSaved();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save traffic fine',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted">
        <CardTitle>Record New Traffic Fine</CardTitle>
        <CardDescription>
          Enter the details of the traffic fine
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {!validation.isValid && validation.isDirty && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>
              {Object.values(validation.errors).join(', ')}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="violationNumber">Violation Number</Label>
            <Input 
              id="violationNumber" 
              placeholder="Enter violation number" 
              value={validation.data.violationNumber || ''}
              onChange={(e) => validation.updateField('violationNumber', e.target.value)}
              disabled={createFineMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="licensePlate" className="flex items-center">
              License Plate
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input 
              id="licensePlate" 
              placeholder="Enter license plate" 
              value={validation.data.licensePlate || ''}
              onChange={(e) => validation.updateField('licensePlate', e.target.value)}
              disabled={createFineMutation.isPending}
              className={validation.getFieldError('licensePlate') ? 'border-destructive' : ''}
            />
            {validation.getFieldError('licensePlate') && (
              <p className="text-destructive text-sm mt-1">{validation.getFieldError('licensePlate')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="violationDate" className="flex items-center">
              Violation Date
              <span className="text-destructive ml-1">*</span>
            </Label>
            <DatePicker
              date={validation.data.violationDate}
              onSelect={(date) => validation.updateField('violationDate', date)}
              disabled={createFineMutation.isPending}
              className={validation.getFieldError('violationDate') ? 'border-destructive' : ''}
            />
            {validation.getFieldError('violationDate') && (
              <p className="text-destructive text-sm mt-1">{validation.getFieldError('violationDate')}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fineAmount" className="flex items-center">
              Fine Amount
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input 
              id="fineAmount" 
              type="number"
              placeholder="0.00" 
              value={validation.data.fineAmount || ''}
              onChange={(e) => validation.updateField('fineAmount', e.target.value ? parseFloat(e.target.value) : null)}
              disabled={createFineMutation.isPending}
              className={validation.getFieldError('fineAmount') ? 'border-destructive' : ''}
            />
            {validation.getFieldError('fineAmount') && (
              <p className="text-destructive text-sm mt-1">{validation.getFieldError('fineAmount')}</p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              placeholder="Enter location of violation" 
              value={validation.data.location || ''}
              onChange={(e) => validation.updateField('location', e.target.value)}
              disabled={createFineMutation.isPending}
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="violationCharge">Violation Charge</Label>
            <Textarea 
              id="violationCharge" 
              placeholder="Enter violation charge details" 
              value={validation.data.violationCharge || ''}
              onChange={(e) => validation.updateField('violationCharge', e.target.value)}
              disabled={createFineMutation.isPending}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => validation.resetForm()}
            variant="outline"
            className="mr-2"
            disabled={createFineMutation.isPending}
          >
            Clear
          </Button>
          
          <Button 
            type="submit" 
            onClick={() => createFineMutation.mutate(validation.data)}
            disabled={createFineMutation.isPending || !validation.data.licensePlate}
          >
            {createFineMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Traffic Fine'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
