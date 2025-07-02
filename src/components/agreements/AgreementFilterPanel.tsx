
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X, Calendar, Plus } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


interface AgreementFilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function AgreementFilterPanel({ onFilterChange, currentFilters = {} }: AgreementFilterPanelProps) {
  const [agreementNumber, setAgreementNumber] = useState(currentFilters?.agreement_number || '');
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
  const [createdDateFrom, setCreatedDateFrom] = useState(
    currentFilters?.created_date_after ? new Date(currentFilters.created_date_after) : undefined
  );
  const [createdDateTo, setCreatedDateTo] = useState(
    currentFilters?.created_date_before ? new Date(currentFilters.created_date_before) : undefined
  );
  const [licensePlate, setLicensePlate] = useState(currentFilters?.license_plate || '');
  const [minRent, setMinRent] = useState(currentFilters?.rent_min || '');
  const [maxRent, setMaxRent] = useState(currentFilters?.rent_max || '');
  const [status, setStatus] = useState(currentFilters?.status || 'all');

  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    if (agreementNumber) filters.agreement_number = agreementNumber;
    if (status && status !== 'all') filters.status = status;
    if (licensePlate) filters.license_plate = licensePlate;
    
    // Date filters for agreement period
    if (startDateFrom) filters.start_date_after = startDateFrom.toISOString();
    if (startDateTo) filters.start_date_before = startDateTo.toISOString();
    if (endDateFrom) filters.end_date_after = endDateFrom.toISOString();
    if (endDateTo) filters.end_date_before = endDateTo.toISOString();
    
    // Date filters for creation date
    if (createdDateFrom) filters.created_date_after = createdDateFrom.toISOString();
    if (createdDateTo) filters.created_date_before = createdDateTo.toISOString();
    
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
    setCreatedDateFrom(undefined);
    setCreatedDateTo(undefined);
    setMinRent('');
    setMaxRent('');
    setStatus('all');
    setLicensePlate('');
    
    onFilterChange({
      agreement_number: undefined,
      status: undefined,
      start_date_after: undefined,
      start_date_before: undefined,
      end_date_after: undefined,
      end_date_before: undefined,
      created_date_after: undefined,
      created_date_before: undefined,
      rent_min: undefined,
      rent_max: undefined,
      license_plate: undefined,
    });
  };

  // Helper function for today's date filter
  const getToday = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return { startOfDay, endOfDay };
  };

  return (
    <div className="p-4" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Quick Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold mb-2 text-right">فلاتر سريعة</h3>
          <div className="text-xs text-muted-foreground mb-3 text-right">
            💡 نصيحة: استخدم البحث العام أعلاه للبحث برقم العقد أو اسم العميل أو رقم السيارة
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-right justify-end"
              onClick={() => onFilterChange({ status: 'active' })}
            >
              العقود النشطة
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-right justify-end"
              onClick={() => {
                const { startOfDay, endOfDay } = getToday();
                onFilterChange({ 
                  created_date_after: startOfDay.toISOString(),
                  created_date_before: endOfDay.toISOString()
                });
              }}
            >
              <Plus className="h-3 w-3 ml-1" />
              أُنشِئت اليوم
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-right justify-end"
              onClick={() => {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                onFilterChange({ 
                  created_date_after: lastWeek.toISOString(),
                  created_date_before: new Date().toISOString()
                });
              }}
            >
              <Calendar className="h-3 w-3 ml-1" />
              آخر أسبوع
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-right justify-end"
              onClick={() => {
                const next30Days = new Date();
                next30Days.setDate(next30Days.getDate() + 30);
                onFilterChange({ 
                  end_date_after: new Date().toISOString(),
                  end_date_before: next30Days.toISOString()
                });
              }}
            >
              تنتهي خلال 30 يوم
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs text-right justify-end"
              onClick={() => onFilterChange({ status: 'pending' })}
            >
              قيد الانتظار
            </Button>
          </div>
        </div>

        {/* Main Filter Form */}
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreement-number" className="text-right">رقم العقد</Label>
              <Input
                id="agreement-number"
                placeholder="البحث برقم العقد"
                value={agreementNumber}
                onChange={(e) => setAgreementNumber(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-plate" className="text-right">لوحة الأرقام</Label>
              <Input
                id="license-plate"
                placeholder="البحث بلوحة الأرقام"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">حالة العقد</Label>
              <Select
                value={status}
                onValueChange={setStatus}
                dir="rtl"
              >
                <SelectTrigger id="status" className="h-9">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rent-min" className="text-right">الحد الأدنى للإيجار</Label>
              <Input
                id="rent-min"
                placeholder="المبلغ الأدنى"
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-max" className="text-right">الحد الأعلى للإيجار</Label>
              <Input
                id="rent-max"
                placeholder="المبلغ الأعلى"
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>
            
            {/* Created Date Range */}
            <div className="space-y-2">
              <Label className="text-right">تاريخ إنشاء العقد (من)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-end text-right font-normal h-9"
                    dir="rtl"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {createdDateFrom ? (
                      format(createdDateFrom, "d MMMM yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={createdDateFrom}
                    onSelect={setCreatedDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-right">تاريخ إنشاء العقد (إلى)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-end text-right font-normal h-9"
                    dir="rtl"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {createdDateTo ? (
                      format(createdDateTo, "d MMMM yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={createdDateTo}
                    onSelect={setCreatedDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-right">تاريخ بداية العقد (من)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-end text-right font-normal h-9"
                    dir="rtl"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDateFrom ? (
                      format(startDateFrom, "d MMMM yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDateFrom}
                    onSelect={setStartDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label className="text-right">تاريخ بداية العقد (إلى)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-end text-right font-normal h-9"
                    dir="rtl"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {startDateTo ? (
                      format(startDateTo, "d MMMM yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDateTo}
                    onSelect={setStartDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-start space-x-2 pt-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetFilters}
              className="h-8"
            >
              <X className="ml-1 h-3 w-3" />
              إعادة تعيين
            </Button>
            <Button 
              size="sm" 
              onClick={handleApplyFilters}
              className="h-8"
            >
              <Filter className="ml-1 h-3 w-3" />
              تطبيق المرشحات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
