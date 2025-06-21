
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  hijriToGregorian, 
  gregorianToHijri, 
  formatHijriDateArabic, 
  isValidHijriDate,
  HIJRI_MONTHS_ARABIC,
  getHijriMonthNameArabic
} from '@/utils/hijri-date-utils';

interface HijriDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  showBothDates?: boolean;
}

export const HijriDatePicker: React.FC<HijriDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'اختر التاريخ الهجري',
  label,
  error,
  disabled = false,
  className,
  required = false,
  showBothDates = true,
}) => {
  const [open, setOpen] = useState(false);
  const [hijriDate, setHijriDate] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedMonth, setSelectedMonth] = useState<number>();
  const [selectedDay, setSelectedDay] = useState<number>();

  // Initialize Hijri date when value changes
  useEffect(() => {
    if (value) {
      const hijriStr = gregorianToHijri(value);
      if (hijriStr) {
        setHijriDate(hijriStr);
        const parts = hijriStr.split('/');
        if (parts.length === 3) {
          setSelectedYear(parseInt(parts[0]));
          setSelectedMonth(parseInt(parts[1]));
          setSelectedDay(parseInt(parts[2]));
        }
      }
    } else {
      setHijriDate('');
      setSelectedYear(undefined);
      setSelectedMonth(undefined);
      setSelectedDay(undefined);
    }
  }, [value]);

  // Handle direct text input
  const handleHijriDateChange = (inputValue: string) => {
    setHijriDate(inputValue);
    
    if (isValidHijriDate(inputValue)) {
      const gregorianDate = hijriToGregorian(inputValue);
      onChange(gregorianDate || undefined);
    }
  };

  // Handle dropdown selection
  const handleDropdownSelection = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const hijriStr = `${selectedYear}/${selectedMonth.toString().padStart(2, '0')}/${selectedDay.toString().padStart(2, '0')}`;
      setHijriDate(hijriStr);
      
      const gregorianDate = hijriToGregorian(hijriStr);
      if (gregorianDate) {
        onChange(gregorianDate);
        setOpen(false);
      }
    }
  };

  // Generate year options (current Hijri year ± 50 years)
  const currentHijriYear = new Date().getFullYear() - 622 + Math.floor((new Date().getFullYear() - 622) * 0.03); // Approximate
  const years = Array.from({ length: 101 }, (_, i) => currentHijriYear - 50 + i);

  // Generate day options based on selected month
  const getDaysInMonth = (month: number, year: number) => {
    // Hijri months alternate between 29 and 30 days, with some variation
    const daysInMonth = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    return daysInMonth[month - 1] || 30;
  };

  const days = selectedMonth && selectedYear 
    ? Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1)
    : Array.from({ length: 30 }, (_, i) => i + 1);

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
      
      <div className="space-y-2">
        {/* Direct input for Hijri date */}
        <div className="relative">
          <Input
            value={hijriDate}
            onChange={(e) => handleHijriDateChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'text-right dir-rtl pl-10',
              error && 'border-red-500',
              className
            )}
          />
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Dropdown selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-center text-right dir-rtl"
              disabled={disabled}
            >
              أو اختر من القائمة
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4" dir="rtl">
              <div className="grid grid-cols-3 gap-2">
                {/* Year selection */}
                <div>
                  <Label className="text-right block mb-1">السنة</Label>
                  <Select value={selectedYear?.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-right">
                          {year} هـ
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month selection */}
                <div>
                  <Label className="text-right block mb-1">الشهر</Label>
                  <Select value={selectedMonth?.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="الشهر" />
                    </SelectTrigger>
                    <SelectContent>
                      {HIJRI_MONTHS_ARABIC.map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()} className="text-right">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Day selection */}
                <div>
                  <Label className="text-right block mb-1">اليوم</Label>
                  <Select value={selectedDay?.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اليوم" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day.toString()} className="text-right">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleDropdownSelection}
                disabled={!selectedYear || !selectedMonth || !selectedDay}
                className="w-full"
              >
                تأكيد التاريخ
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Display both dates if enabled */}
        {showBothDates && value && (
          <div className="text-sm text-muted-foreground text-right space-y-1">
            <div>التاريخ الهجري: {formatHijriDateArabic(hijriDate)}</div>
            <div>التاريخ الميلادي: {value.toLocaleDateString('ar-SA')}</div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 text-right">{error}</p>
      )}
    </div>
  );
};

// Utility component for mixed date display
export const MixedDateDisplay: React.FC<{
  date: Date | string | null;
  showBoth?: boolean;
  className?: string;
}> = ({ date, showBoth = true, className }) => {
  if (!date) return null;

  const gregorianDate = date instanceof Date ? date : new Date(date);
  const hijriStr = gregorianToHijri(gregorianDate);

  if (!showBoth) {
    return <span className={className}>{gregorianDate.toLocaleDateString('ar-SA')}</span>;
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-sm">{gregorianDate.toLocaleDateString('ar-SA')} م</div>
      {hijriStr && (
        <div className="text-xs text-muted-foreground">{formatHijriDateArabic(hijriStr)}</div>
      )}
    </div>
  );
};
