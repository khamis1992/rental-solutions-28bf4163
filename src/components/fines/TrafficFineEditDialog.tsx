
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TrafficFineEditDialogProps {
  trafficFine: TrafficFine | null;
  onSave: () => void;
  onCancel: () => void;
}

export const TrafficFineEditDialog: React.FC<TrafficFineEditDialogProps> = ({
  trafficFine,
  onSave,
  onCancel
}) => {
  const [fineData, setFineData] = useState<Partial<TrafficFine> | null>(null);
  const [violationDate, setViolationDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const { updateTrafficFine, validateLicensePlate } = useTrafficFines();
  
  useEffect(() => {
    if (trafficFine) {
      setFineData({...trafficFine});
      
      // Convert violation_date to Date object for the calendar
      if (trafficFine.violation_date) {
        try {
          const date = new Date(trafficFine.violation_date);
          setViolationDate(date);
        } catch (error) {
          console.error('Error parsing violation date:', error);
          setViolationDate(null);
        }
      } else {
        setViolationDate(null);
      }
    }
  }, [trafficFine]);
  
  const handleChange = (field: keyof TrafficFine, value: any) => {
    setFineData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSave = async () => {
    if (!fineData || !fineData.id) {
      toast.error('No fine data to save');
      return;
    }
    
    try {
      // Validate license plate
      if (fineData.license_plate) {
        const validation = await validateLicensePlate(fineData.license_plate);
        if (!validation.isValid) {
          toast.warning(validation.message);
          // Continue with saving despite warning
        }
      }
      
      // Create a data object with the correct date format
      const saveData: Partial<TrafficFine> & { id: string } = {
        ...fineData,
        id: fineData.id,
        // Convert Date to string for the API
        violation_date: violationDate ? violationDate.toISOString() : undefined,
      };
      
      await updateTrafficFine.mutateAsync(saveData);
      onSave();
    } catch (error) {
      console.error('Error saving traffic fine:', error);
      toast.error('Failed to save traffic fine');
    }
  };
  
  if (!fineData) return null;
  
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Edit Traffic Fine</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="violationNumber">Violation #</Label>
            <Input
              id="violationNumber"
              value={fineData.violation_number || ''}
              onChange={(e) => handleChange('violation_number', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate</Label>
            <Input
              id="license_plate"
              value={fineData.license_plate || ''}
              onChange={(e) => handleChange('license_plate', e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="violation_date">Violation Date</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !violationDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {violationDate ? format(violationDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={violationDate || undefined}
                onSelect={(date) => {
                  setViolationDate(date);
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fine_location">Location</Label>
          <Input
            id="fine_location"
            value={fineData.fine_location || ''}
            onChange={(e) => handleChange('fine_location', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="violation_charge">Violation Charge</Label>
          <Textarea
            id="violation_charge"
            value={fineData.violation_charge || ''}
            onChange={(e) => handleChange('violation_charge', e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fine_amount">Fine Amount</Label>
          <Input
            id="fine_amount"
            type="number"
            value={fineData.fine_amount || 0}
            onChange={(e) => handleChange('fine_amount', Number(e.target.value))}
          />
          <div className="text-xs text-muted-foreground">
            Current: {formatCurrency(fineData.fine_amount || 0)}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSave} disabled={updateTrafficFine.isPending}>
          {updateTrafficFine.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
