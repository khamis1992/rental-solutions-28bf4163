import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AgreementFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function AgreementFilters({ onFilterChange, currentFilters = {} }: AgreementFiltersProps) {
  const [agreementNumber, setAgreementNumber] = useState(currentFilters?.agreement_number || '');
  const [dateRange, setDateRange] = useState('rental_period' as 'rental_period' | 'creation_date');
  const [startDateFrom, setStartDateFrom] = useState(
    currentFilters?.start_date_after ? new Date(currentFilters.start_date_after) : undefined
  );
  const [startDateTo, setStartDateTo] = useState(
    currentFilters?.start_date_before ? new Date(currentFilters.start_date_before) : undefined
  );
  const [endDateFrom, setEndDateFrom] = useState(
    currentFilters?.end_date_after ? new Date(currentFilters.end_date_after) : undefined
  );
  const [endDateTo, setEndDateTo] = useState(
    currentFilters?.end_date_before ? new Date(currentFilters.end_date_before) : undefined
  );
  const [minRent, setMinRent] = useState(currentFilters?.rent_min || '');
  const [maxRent, setMaxRent] = useState(currentFilters?.rent_max || '');
  const [status, setStatus] = useState(currentFilters?.status || 'all');

  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    if (agreementNumber) filters.agreement_number = agreementNumber;
    if (status && status !== 'all') filters.status = status;
    
    // Date filters
    if (startDateFrom) filters.start_date_after = startDateFrom.toISOString();
    if (startDateTo) filters.start_date_before = startDateTo.toISOString();
    if (endDateFrom) filters.end_date_after = endDateFrom.toISOString();
    if (endDateTo) filters.end_date_before = endDateTo.toISOString();
    
    // Rent range
    if (minRent) filters.rent_min = minRent;
    if (maxRent) filters.rent_max = maxRent;
    
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setAgreementNumber('');
    setStartDateFrom(undefined);
    setStartDateTo(undefined);
    setEndDateFrom(undefined);
    setEndDateTo(undefined);
    setMinRent('');
    setMaxRent('');
    setStatus('all');
    
    onFilterChange({
      agreement_number: undefined,
      status: undefined,
      start_date_after: undefined,
      start_date_before: undefined,
      end_date_after: undefined,
      end_date_before: undefined,
      rent_min: undefined,
      rent_max: undefined,
    });
  };

  const handleApplyQuickFilter = (quickFilter: Record<string, any>) => {
    console.log('Applying quick filter:', quickFilter);
    onFilterChange(quickFilter);
  };

  // Generate today and date ranges for quick filters
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Quick Filters */}
        <Card className="p-4" dir="rtl">
          <h3 className="text-sm font-medium mb-3 flex items-center justify-end">
            <Filter className="h-4 w-4 ml-1.5" /> فلاتر سريعة
          </h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-end text-right" 
              onClick={() => handleApplyQuickFilter({ status: 'active' })}
            >
              العقود النشطة
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-end text-right" 
              onClick={() => handleApplyQuickFilter({ 
                end_date_after: today.toISOString(),
                end_date_before: next30Days.toISOString()
              })}
            >
              عقود ستنتهي خلال 30 يوماً
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-end text-right"
              onClick={() => handleApplyQuickFilter({ 
                start_date_after: lastMonth.toISOString(),
                start_date_before: today.toISOString()
              })}
            >
              عقود أنشئت خلال الشهر الماضي
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-end text-right"
              onClick={() => handleApplyQuickFilter({ status: 'pending' })}
            >
              العقود المعلقة
            </Button>
          </div>
        </Card>

        {/* Main Filter Form */}
        <div className="md:col-span-2 space-y-4" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreement-number" className="text-right">رقم العقد</Label>
              <Input
                id="agreement-number"
                placeholder="فلترة حسب رقم العقد"
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">الحالة</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
                dir="rtl"
              >
                <SelectTrigger id="status" dir="rtl">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-right">نوع التاريخ</Label>
            <RadioGroup
              defaultValue="rental_period"
              value={dateRange}
              onValueChange={(value) => setDateRange(value as 'rental_period' | 'creation_date')}
              className="flex space-x-4 space-x-reverse"
              dir="rtl"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Label htmlFor="rental_period" className="cursor-pointer">فترة الإيجار</Label>
                <RadioGroupItem value="rental_period" id="rental_period" />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Label htmlFor="creation_date" className="cursor-pointer">تاريخ الإنشاء</Label>
                <RadioGroupItem value="creation_date" id="creation_date" />
              </div>
            </RadioGroup>
          </div>

          {dateRange === 'rental_period' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-right">نطاق تاريخ البداية</Label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-end text-right font-normal"
                        dir="rtl"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {startDateFrom ? (
                          format(startDateFrom, "MMM d, yyyy")
                        ) : (
                          "من تاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateFrom}
                        onSelect={setStartDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-end text-right font-normal"
                        dir="rtl"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {startDateTo ? (
                          format(startDateTo, "MMM d, yyyy")
                        ) : (
                          "إلى تاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateTo}
                        onSelect={setStartDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-right">نطاق تاريخ النهاية</Label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-end text-right font-normal"
                        dir="rtl"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {endDateFrom ? (
                          format(endDateFrom, "MMM d, yyyy")
                        ) : (
                          "من تاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateFrom}
                        onSelect={setEndDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-end text-right font-normal"
                        dir="rtl"
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {endDateTo ? (
                          format(endDateTo, "MMM d, yyyy")
                        ) : (
                          "إلى تاريخ"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateTo}
                        onSelect={setEndDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-right">تاريخ إنشاء العقد</Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-end text-right font-normal"
                      dir="rtl"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDateFrom ? (
                        format(startDateFrom, "MMM d, yyyy")
                      ) : (
                        "من تاريخ"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateFrom}
                      onSelect={setStartDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-end text-right font-normal"
                      dir="rtl"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDateTo ? (
                        format(startDateTo, "MMM d, yyyy")
                      ) : (
                        "إلى تاريخ"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateTo}
                      onSelect={setStartDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-rent" className="text-right">الحد الأدنى للإيجار</Label>
              <Input
                id="min-rent"
                placeholder="0"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-rent" className="text-right">الحد الأقصى للإيجار</Label>
              <Input
                id="max-rent"
                placeholder="10000"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 space-x-reverse" dir="rtl">
        <Button onClick={handleApplyFilters}>
          تطبيق الفلاتر
        </Button>
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
          className="flex items-center flex-row-reverse"
        >
          <X className="ml-1 h-4 w-4" />
          إعادة تعيين
        </Button>
      </div>
    </div>
  );
}
