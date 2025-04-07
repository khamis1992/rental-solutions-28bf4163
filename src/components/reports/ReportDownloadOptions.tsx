import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { useDownloadReport } from '@/hooks/use-download-report';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReportDownloadOptionsProps {
  reportType: string;
  fileNamePrefix: string;
  additionalParams?: Record<string, any>;
}

export function ReportDownloadOptions({ reportType, fileNamePrefix, additionalParams }: ReportDownloadOptionsProps) {
  const [dateRange, setDateRange] = useState<any>({
    from: new Date(),
    to: new Date(),
  });

  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const { downloadReport, isLoading } = useDownloadReport();

  const handleDownload = async () => {
    const params = {
      reportType: reportType,
      fileNamePrefix: fileNamePrefix,
      dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
      dateTo: format(dateRange.to, 'yyyy-MM-dd'),
      ...additionalParams,
    };

    await downloadReport(params);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from // Ensure 'to' is always defined
      });
    }
  };

  return (
    <div>
      <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange ? 'text-muted-foreground' : undefined
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              <>
                {format(dateRange.from, 'yyyy-MM-dd')} - {format(dateRange.to, 'yyyy-MM-dd')}
              </>
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DateRange
            onChange={handleDateRangeChange}
            ranges={[dateRange]}
            showDateDisplay={false}
            direction="horizontal"
          />
        </PopoverContent>
      </Popover>

      <Button className="ml-2" onClick={handleDownload} disabled={isLoading}>
        {isLoading ? 'Downloading...' : 'Download Report'}
      </Button>
    </div>
  );
}
