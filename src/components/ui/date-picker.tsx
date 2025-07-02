
// @ts-nocheck
/* eslint-disable */

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ 
  date, 
  setDate, 
  className,
  placeholder = "اختر تاريخ",
  disabled = false
}: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(date ? date.getMonth() : new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState<number>(date ? date.getFullYear() : new Date().getFullYear());

  // Generate years for the selector (10 years back and 20 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => currentYear - 10 + i);
  
  // Generate months for the selector in Arabic
  const months = [
    { value: 0, label: "يناير" },
    { value: 1, label: "فبراير" },
    { value: 2, label: "مارس" },
    { value: 3, label: "أبريل" },
    { value: 4, label: "مايو" },
    { value: 5, label: "يونيو" },
    { value: 6, label: "يوليو" },
    { value: 7, label: "أغسطس" },
    { value: 8, label: "سبتمبر" },
    { value: 9, label: "أكتوبر" },
    { value: 10, label: "نوفمبر" },
    { value: 11, label: "ديسمبر" },
  ];

  // Update month/year when date changes externally
  React.useEffect(() => {
    if (date) {
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
    }
  }, [date]);

  // Handle month/year changes
  const handleMonthChange = (month: string) => {
    setSelectedMonth(parseInt(month));
    
    const newDate = new Date(selectedYear, parseInt(month), 1);
    const currentDate = date || new Date();
    
    // Preserve the day from the current selection
    if (date) {
      newDate.setDate(Math.min(
        date.getDate(),
        new Date(selectedYear, parseInt(month) + 1, 0).getDate()
      ));
    } else {
      newDate.setDate(currentDate.getDate());
    }
    
    setDate(newDate);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
    
    const newDate = new Date(parseInt(year), selectedMonth, 1);
    const currentDate = date || new Date();
    
    // Preserve the day from the current selection
    if (date) {
      newDate.setDate(Math.min(
        date.getDate(),
        new Date(parseInt(year), selectedMonth + 1, 0).getDate()
      ));
    } else {
      newDate.setDate(currentDate.getDate());
    }
    
    setDate(newDate);
  };

  // Format date for display in Arabic
  const formatDisplayDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div dir="rtl">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-right font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            disabled={disabled}
            dir="rtl"
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {date ? formatDisplayDate(date) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex p-3 pb-0 border-b" dir="rtl">
            <div className="grid grid-cols-2 gap-2 w-full">
              <div>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={handleMonthChange}
                  dir="rtl"
                >
                  <SelectTrigger className="h-8 text-right">
                    <SelectValue placeholder="الشهر" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()} className="text-right">
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={handleYearChange}
                  dir="rtl"
                >
                  <SelectTrigger className="h-8 text-right">
                    <SelectValue placeholder="السنة" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-right">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              setDate(day);
              setCalendarOpen(false);
              if (day) {
                setSelectedMonth(day.getMonth());
                setSelectedYear(day.getFullYear());
              }
            }}
            month={new Date(selectedYear, selectedMonth)}
            onMonthChange={(month) => {
              setSelectedMonth(month.getMonth());
              setSelectedYear(month.getFullYear());
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  className,
  disabled = false
}: DateRangePickerProps) {
  return (
    <div className={cn("flex space-x-2 items-center space-x-reverse gap-2", className)} dir="rtl">
      <DatePicker
        date={startDate}
        setDate={setStartDate}
        placeholder="تاريخ البداية"
        disabled={disabled}
      />
      <span className="text-muted-foreground">إلى</span>
      <DatePicker
        date={endDate}
        setDate={setEndDate}
        placeholder="تاريخ النهاية"
        disabled={disabled}
      />
    </div>
  );
}
