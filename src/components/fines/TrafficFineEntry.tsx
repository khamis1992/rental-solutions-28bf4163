
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { useTrafficFineValidation } from '@/hooks/validation/use-traffic-fine-validation';

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry: React.FC<TrafficFineEntryProps> = ({ onFineSaved }) => {
  const [submitting, setSubmitting] = useState(false);
  const { createTrafficFine } = useTrafficFines();
  const {
    data,
    updateField,
    validateAll,
    getFieldError,
    resetForm
  } = useTrafficFineValidation({
    violationDate: new Date(),
    paymentStatus: 'pending'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const isValid = validateAll();
    
    if (!isValid) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await createTrafficFine.mutateAsync({
        violationNumber: data.violationNumber || '',
        licensePlate: data.licensePlate || '',
        violationDate: data.violationDate as Date,
        fineAmount: data.fineAmount || 0,
        violationCharge: data.violationCharge,
        location: data.location,
        paymentStatus: data.paymentStatus as any,
      });
      
      toast.success('Traffic fine recorded successfully');
      resetForm({
        violationDate: new Date(),
        paymentStatus: 'pending'
      });
      
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      console.error('Error creating traffic fine:', error);
      toast.error('Failed to record traffic fine', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Traffic Fine</CardTitle>
        <CardDescription>
          Enter details about a traffic violation to add it to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* License Plate Field */}
            <div className="space-y-2">
              <Label htmlFor="licensePlate" className={cn(getFieldError('licensePlate') ? "text-destructive" : "")}>
                License Plate <span className="text-destructive">*</span>
              </Label>
              <Input
                id="licensePlate"
                placeholder="e.g., ABC123"
                value={data.licensePlate || ''}
                onChange={(e) => updateField('licensePlate', e.target.value)}
                className={cn(getFieldError('licensePlate') ? "border-destructive" : "")}
              />
              {getFieldError('licensePlate') && (
                <p className="text-xs text-destructive">{getFieldError('licensePlate')}</p>
              )}
            </div>

            {/* Violation Number Field */}
            <div className="space-y-2">
              <Label htmlFor="violationNumber">Violation/Reference Number</Label>
              <Input
                id="violationNumber"
                placeholder="e.g., TF-12345"
                value={data.violationNumber || ''}
                onChange={(e) => updateField('violationNumber', e.target.value)}
              />
            </div>

            {/* Violation Date Field */}
            <div className="space-y-2">
              <Label htmlFor="violationDate" className={cn(getFieldError('violationDate') ? "text-destructive" : "")}>
                Violation Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.violationDate && "text-muted-foreground",
                      getFieldError('violationDate') && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.violationDate ? (
                      data.violationDate instanceof Date ? 
                        format(data.violationDate, "PPP") : 
                        format(new Date(data.violationDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar
                    mode="single"
                    selected={data.violationDate instanceof Date ? data.violationDate : new Date(data.violationDate || Date.now())}
                    onSelect={(date) => updateField('violationDate', date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {getFieldError('violationDate') && (
                <p className="text-xs text-destructive">{getFieldError('violationDate')}</p>
              )}
            </div>

            {/* Fine Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="fineAmount" className={cn(getFieldError('fineAmount') ? "text-destructive" : "")}>
                Fine Amount (QAR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fineAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 500"
                value={data.fineAmount || ''}
                onChange={(e) => updateField('fineAmount', parseFloat(e.target.value))}
                className={cn(getFieldError('fineAmount') ? "border-destructive" : "")}
              />
              {getFieldError('fineAmount') && (
                <p className="text-xs text-destructive">{getFieldError('fineAmount')}</p>
              )}
            </div>

            {/* Violation Charge Field */}
            <div className="space-y-2">
              <Label htmlFor="violationCharge" className={cn(getFieldError('violationCharge') ? "text-destructive" : "")}>
                Violation Charge
              </Label>
              <Input
                id="violationCharge"
                placeholder="e.g., Speeding"
                value={data.violationCharge || ''}
                onChange={(e) => updateField('violationCharge', e.target.value)}
                className={cn(getFieldError('violationCharge') ? "border-destructive" : "")}
              />
              {getFieldError('violationCharge') && (
                <p className="text-xs text-destructive">{getFieldError('violationCharge')}</p>
              )}
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <Label htmlFor="location" className={cn(getFieldError('location') ? "text-destructive" : "")}>
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., Al Sadd Street"
                value={data.location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                className={cn(getFieldError('location') ? "border-destructive" : "")}
              />
              {getFieldError('location') && (
                <p className="text-xs text-destructive">{getFieldError('location')}</p>
              )}
            </div>

            {/* Payment Status Field */}
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={data.paymentStatus || 'pending'}
                onValueChange={(value) => updateField('paymentStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => resetForm({
                violationDate: new Date(),
                paymentStatus: 'pending'
              })}
            >
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Traffic Fine"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
