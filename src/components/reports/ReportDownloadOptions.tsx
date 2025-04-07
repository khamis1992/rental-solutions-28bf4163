
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

interface ReportDownloadOptionsProps {
  reportType: string;
  fileNamePrefix: string;
  additionalParams?: Record<string, any>;
  getReportData?: () => Record<string, any>[];
}

export function ReportDownloadOptions({ reportType, fileNamePrefix, additionalParams, getReportData }: ReportDownloadOptionsProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const downloadReport = async (params: any) => {
    setIsLoading(true);
    try {
      // Get report data from parent component
      const reportData = getReportData ? getReportData() : [];
      
      // For now, just log the data - in a real implementation you'd 
      // generate and download a CSV/PDF here
      console.log('Downloading report with params:', params);
      console.log('Report data:', reportData);
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!date?.from) return;

    const params = {
      reportType: reportType,
      fileNamePrefix: fileNamePrefix,
      dateFrom: format(date.from, 'yyyy-MM-dd'),
      dateTo: date.to ? format(date.to, 'yyyy-MM-dd') : format(date.from, 'yyyy-MM-dd'),
      ...additionalParams,
    };

    await downloadReport(params);
  };

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "PPP")} - {format(date.to, "PPP")}
                </>
              ) : (
                format(date.from, "PPP")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button onClick={handleDownload} disabled={isLoading}>
        {isLoading ? 'Downloading...' : 'Download Report'}
      </Button>
    </div>
  );
}
