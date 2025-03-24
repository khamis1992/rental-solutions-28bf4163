
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReportDownloadOptionsProps {
  reportType: string;
}

const ReportDownloadOptions = ({ reportType }: ReportDownloadOptionsProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(),
    to: new Date(),
  });
  const [fileFormat, setFileFormat] = useState('pdf');

  const handleDownload = () => {
    // This would be wired up to an actual download service
    console.log('Downloading report:', {
      type: reportType,
      dateRange,
      format: fileFormat,
      logo: '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png', // Include logo in report generation
      footerLogo: '/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png', // Include footer logo in report generation
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png" 
            alt="Alaraf Car Rental" 
            className="h-10 mr-4" 
          />
          <h3 className="text-lg font-semibold">Report Options</h3>
        </div>
        <img 
          src="/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png" 
          alt="Alaraf Car Rental Footer" 
          className="h-5" 
        />
      </div>
      
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
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
                defaultMonth={dateRange?.from}
                selected={dateRange as any}
                onSelect={(range) => setDateRange(range as any)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-40">
          <Select value={fileFormat} onValueChange={setFileFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownload}>
          <FileDown className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
    </div>
  );
};

export default ReportDownloadOptions;
