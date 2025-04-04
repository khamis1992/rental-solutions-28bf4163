
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { arSA } from 'date-fns/locale';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/contexts/TranslationContext";

interface DatePickerWithRangeProps {
  date?: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const { t, language, isRTL } = useTranslation();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              isRTL && "flex-row-reverse"
            )}
          >
            <CalendarIcon className={isRTL ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {date?.from ? (
              date.to ? (
                <>
                  {isRTL ? (
                    <>
                      {format(date.to, "LLL dd, y", { locale: language === 'ar' ? arSA : undefined })} -{" "}
                      {format(date.from, "LLL dd, y", { locale: language === 'ar' ? arSA : undefined })}
                    </>
                  ) : (
                    <>
                      {format(date.from, "LLL dd, y", { locale: language === 'ar' ? arSA : undefined })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: language === 'ar' ? arSA : undefined })}
                    </>
                  )}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: language === 'ar' ? arSA : undefined })
              )
            ) : (
              <span>{t("reports.pickDateRange")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={isRTL ? "end" : "start"}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            locale={language === 'ar' ? arSA : undefined}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
