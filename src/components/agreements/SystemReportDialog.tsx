
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

interface SystemReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (options: ReportOptions) => Promise<void>;
  isGenerating: boolean;
}

export interface ReportOptions {
  reportType: 'summary' | 'detailed';
  includeFinancials: boolean;
  statusFilter: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
}

export function SystemReportDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating
}: SystemReportDialogProps) {
  const [options, setOptions] = useState<ReportOptions>({
    reportType: 'summary',
    includeFinancials: true,
    statusFilter: Object.values(AgreementStatus),
    dateRange: {}
  });

  const handleStatusChange = (status: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      statusFilter: checked 
        ? [...prev.statusFilter, status]
        : prev.statusFilter.filter(s => s !== status)
    }));
  };

  const handleGenerateReport = async () => {
    try {
      await onGenerate(options);
    } catch (error) {
      toast.error("Failed to generate report: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate System Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <RadioGroup
              defaultValue={options.reportType}
              onValueChange={(value) => setOptions({...options, reportType: value as 'summary' | 'detailed'})}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="summary" id="summary" />
                <Label htmlFor="summary">Summary Report (Faster)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed">Detailed Report (Includes all agreements)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Include Sections</Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="financials"
                checked={options.includeFinancials}
                onCheckedChange={(checked) => 
                  setOptions({...options, includeFinancials: !!checked})
                }
              />
              <Label htmlFor="financials">Financial Information</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="block mb-1">Agreement Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AgreementStatus).map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`status-${status}`}
                    checked={options.statusFilter.includes(status)}
                    onCheckedChange={(checked) => handleStatusChange(status, !!checked)}
                  />
                  <Label htmlFor={`status-${status}`}>{status}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="from"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !options.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {options.dateRange.from ? format(options.dateRange.from, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={options.dateRange.from}
                    onSelect={(date) => setOptions({
                      ...options, 
                      dateRange: {...options.dateRange, from: date || undefined}
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="to">To Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="to"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full",
                      !options.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {options.dateRange.to ? format(options.dateRange.to, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={options.dateRange.to}
                    onSelect={(date) => setOptions({
                      ...options, 
                      dateRange: {...options.dateRange, to: date || undefined}
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
