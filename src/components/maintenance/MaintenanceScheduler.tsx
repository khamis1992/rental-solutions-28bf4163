
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CustomButton } from '@/components/ui/custom-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MaintenanceSchedulerProps {
  scheduledDate: Date;
  completionDate?: Date;
  status: string;
  onScheduledDateChange: (date: Date) => void;
  onCompletionDateChange: (date?: Date) => void;
  onStatusChange: (status: string) => void;
}

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  scheduledDate,
  completionDate,
  status,
  onScheduledDateChange,
  onCompletionDateChange,
  onStatusChange
}) => {
  const statusOptions = [
    { value: MaintenanceStatus.SCHEDULED, label: 'Scheduled' },
    { value: MaintenanceStatus.IN_PROGRESS, label: 'In Progress' },
    { value: MaintenanceStatus.COMPLETED, label: 'Completed' },
    { value: MaintenanceStatus.CANCELLED, label: 'Cancelled' }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label>Maintenance Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full mr-2",
                      option.value === 'scheduled' ? "bg-blue-500" :
                      option.value === 'in_progress' ? "bg-yellow-500" :
                      option.value === 'completed' ? "bg-green-500" :
                      "bg-red-500"
                    )}
                  />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground mt-2">
          {status === 'scheduled' && "The maintenance has been scheduled but hasn't started yet."}
          {status === 'in_progress' && "The maintenance work is currently underway."}
          {status === 'completed' && "The maintenance work has been completed."}
          {status === 'cancelled' && "The scheduled maintenance has been cancelled."}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="scheduled-date">Scheduled Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <CustomButton
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !scheduledDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, 'PPP') : <span>Pick a date</span>}
              </CustomButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={(date) => date && onScheduledDateChange(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {(status === 'completed' || status === 'in_progress') && (
          <div className="space-y-2">
            <Label htmlFor="completion-date">
              {status === 'completed' ? 'Completion Date' : 'Start Date'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <CustomButton
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !completionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {completionDate ? format(completionDate, 'PPP') : <span>Pick a date</span>}
                </CustomButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={completionDate}
                  onSelect={(date) => onCompletionDateChange(date || undefined)}
                  disabled={(date) => date > new Date() || date < new Date(scheduledDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceScheduler;
