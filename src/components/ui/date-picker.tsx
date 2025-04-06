
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
import { formatDate } from "@/lib/date-utils";
import { useTranslation } from "@/contexts/TranslationContext";
import { useTranslation as useI18nTranslation } from "react-i18next";

interface DatePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  const { isRTL } = useTranslation();
  const { t } = useI18nTranslation();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {date ? formatDate(date) : <span>{t('agreements.pickDate')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={isRTL ? "end" : "start"}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          className="pointer-events-auto"
          dir={isRTL ? "rtl" : "ltr"}
        />
      </PopoverContent>
    </Popover>
  );
}
