
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
  placeholder = "Pick a date",
  disabled = false
}: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(date ? date.getMonth() : new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState<number>(date ? date.getFullYear() : new Date().getFullYear());

  // Generate years for the selector (10 years back and 20 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => currentYear - 10 + i);
  
  // Generate months for the selector
  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
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

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex p-3 pb-0 border-b">
          <div className="grid grid-cols-2 gap-2 w-full">
            <div>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
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
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
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
    <div className={cn("flex space-x-2 items-center", className)}>
      <DatePicker
        date={startDate}
        setDate={setStartDate}
        placeholder="Start date"
        disabled={disabled}
      />
      <span className="text-muted-foreground">to</span>
      <DatePicker
        date={endDate}
        setDate={setEndDate}
        placeholder="End date"
        disabled={disabled}
      />
    </div>
  );
}
