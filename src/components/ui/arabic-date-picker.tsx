import React from 'react';
import { format, parse } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ArabicDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export const ArabicDatePicker: React.FC<ArabicDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'اختر التاريخ',
  label,
  error,
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          'text-right block',
          required && 'after:content-["*"] after:text-red-500 after:mr-1'
        )}>
          {label}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between text-right dir-rtl',
              !value && 'text-muted-foreground',
              error && 'border-red-500',
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {value ? (
              format(value, 'dd MMMM yyyy', { locale: ar })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
            disabled={(date) => {
              if (disabled) return true;
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            locale={ar}
            dir="rtl"
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
};

interface ArabicTimePickerProps {
  value?: string; // Format: "HH:mm"
  onChange: (time: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  format24Hour?: boolean;
}

export const ArabicTimePicker: React.FC<ArabicTimePickerProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
  className,
  required = false,
  format24Hour = true,
}) => {
  const [hour, setHour] = React.useState(value ? value.split(':')[0] : '');
  const [minute, setMinute] = React.useState(value ? value.split(':')[1] : '');

  React.useEffect(() => {
    if (hour && minute) {
      onChange(`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`);
    }
  }, [hour, minute, onChange]);

  const hours = format24Hour 
    ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
    : Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          'text-right block',
          required && 'after:content-["*"] after:text-red-500 after:mr-1'
        )}>
          {label}
        </Label>
      )}
      
      <div className={cn('flex gap-2 items-center dir-rtl', className)}>
        <Clock className="h-4 w-4 text-muted-foreground" />
        
        <Select value={hour} onValueChange={setHour} disabled={disabled}>
          <SelectTrigger className={cn('w-20 text-center', error && 'border-red-500')}>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-muted-foreground">:</span>
        
        <Select value={minute} onValueChange={setMinute} disabled={disabled}>
          <SelectTrigger className={cn('w-20 text-center', error && 'border-red-500')}>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-sm text-muted-foreground mr-2">
          {format24Hour ? '' : 'ص/م'}
        </span>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
};

interface ArabicDateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format24Hour?: boolean;
}

export const ArabicDateTimePicker: React.FC<ArabicDateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'اختر التاريخ والوقت',
  label,
  error,
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
  format24Hour = true,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [selectedTime, setSelectedTime] = React.useState<string>(
    value ? format(value, 'HH:mm') : ''
  );

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const newDateTime = new Date(date);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDateTime);
    } else {
      onChange(date);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && time) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDateTime);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <Label className={cn(
          'text-right block',
          required && 'after:content-["*"] after:text-red-500 after:mr-1'
        )}>
          {label}
        </Label>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArabicDatePicker
          value={selectedDate}
          onChange={handleDateChange}
          placeholder="اختر التاريخ"
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          error={error}
        />
        
        <ArabicTimePicker
          value={selectedTime}
          onChange={handleTimeChange}
          disabled={disabled}
          format24Hour={format24Hour}
        />
      </div>
      
      {value && (
        <div className="text-sm text-muted-foreground text-right">
          التاريخ والوقت المحدد: {format(value, 'dd MMMM yyyy - HH:mm', { locale: ar })}
        </div>
      )}
    </div>
  );
};

// Utility functions for Arabic date formatting
export const arabicDateUtils = {
  formatDate: (date: Date) => format(date, 'dd MMMM yyyy', { locale: ar }),
  formatTime: (date: Date) => format(date, 'HH:mm', { locale: ar }),
  formatDateTime: (date: Date) => format(date, 'dd MMMM yyyy - HH:mm', { locale: ar }),
  formatShortDate: (date: Date) => format(date, 'dd/MM/yyyy', { locale: ar }),
  formatMonthYear: (date: Date) => format(date, 'MMMM yyyy', { locale: ar }),
  
  parseDate: (dateString: string) => {
    try {
      return parse(dateString, 'dd/MM/yyyy', new Date());
    } catch {
      return null;
    }
  },
  
  isValidDate: (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.getTime());
  },
  
  addDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  subtractDays: (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  },
  
  isSameDay: (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  },
  
  isToday: (date: Date) => {
    return arabicDateUtils.isSameDay(date, new Date());
  },
  
  dayNames: [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 
    'الخميس', 'الجمعة', 'السبت'
  ],
  
  monthNames: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ],
}; 