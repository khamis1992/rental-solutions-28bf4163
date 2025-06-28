import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { CalendarIcon, Filter, X, Clock, Calendar as CalendarIconLucide } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EnhancedAgreementFilterPanelProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters?: Record<string, any>;
}

export function EnhancedAgreementFilterPanel({ onFilterChange, currentFilters = {} }: EnhancedAgreementFilterPanelProps) {
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
  // إضافة حالات تاريخ الإنشاء الجديدة
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
    
    // Date filters - تواريخ العقد
    if (startDateFrom) filters.start_date_after = startDateFrom.toISOString();
    if (startDateTo) filters.start_date_before = startDateTo.toISOString();
    if (endDateFrom) filters.end_date_after = endDateFrom.toISOString();
    if (endDateTo) filters.end_date_before = endDateTo.toISOString();
    
    // تاريخ الإنشاء الجديد
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
    
    onFilterChange({});
  };

  // دوال الأزرار السريعة لتاريخ الإنشاء
  const handleCreatedToday = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    onFilterChange({
      created_date_after: startOfDay.toISOString(),
      created_date_before: endOfDay.toISOString()
    });
  };

  const handleCreatedThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    onFilterChange({
      created_date_after: startOfWeek.toISOString(),
      created_date_before: endOfWeek.toISOString()
    });
  };

  const handleCreatedThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    onFilterChange({
      created_date_after: startOfMonth.toISOString(),
      created_date_before: endOfMonth.toISOString()
    });
  };

  return (
    <div className="p-4" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أزرار سريعة لتاريخ الإنشاء */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold mb-2 text-right flex items-center gap-2">
            <Clock className="h-4 w-4" />
            بحث سريع حسب تاريخ الإنشاء
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleCreatedToday}
            >
              📅 أُنشئت اليوم
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleCreatedThisWeek}
            >
              📅 هذا الأسبوع
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={handleCreatedThisMonth}
            >
              📅 هذا الشهر
            </Button>
          </div>
          
          <h3 className="text-sm font-semibold mb-2 mt-4 text-right">مرشحات أخرى</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => onFilterChange({ status: 'active' })}
            >
              العقود النشطة
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
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
          </div>
        </div>

        {/* Main Filter Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* حقل رقم العقد */}
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

            {/* لوحة السيارة */}
            <div className="space-y-2">
              <Label htmlFor="license-plate" className="text-right">لوحة السيارة</Label>
              <Input
                id="license-plate"
                placeholder="البحث بلوحة السيارة"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>

            {/* حالة العقد */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">حالة العقد</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="h-9">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تاريخ إنشاء العقد - من */}
            <div className="space-y-2">
              <Label className="text-right">تاريخ إنشاء العقد (من)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal h-9"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {createdDateFrom ? (
                      format(createdDateFrom, "MMM d, yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={createdDateFrom}
                    onSelect={setCreatedDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* تاريخ إنشاء العقد - إلى */}
            <div className="space-y-2">
              <Label className="text-right">تاريخ إنشاء العقد (إلى)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal h-9"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {createdDateTo ? (
                      format(createdDateTo, "MMM d, yyyy")
                    ) : (
                      "اختر التاريخ"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={createdDateTo}
                    onSelect={setCreatedDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* مبلغ الإيجار الأدنى */}
            <div className="space-y-2">
              <Label htmlFor="rent-min" className="text-right">أقل مبلغ إيجار</Label>
              <Input
                id="rent-min"
                placeholder="أقل مبلغ"
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>

            {/* مبلغ الإيجار الأعلى */}
            <div className="space-y-2">
              <Label htmlFor="rent-max" className="text-right">أعلى مبلغ إيجار</Label>
              <Input
                id="rent-max"
                placeholder="أعلى مبلغ"
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="h-9 text-right"
                dir="rtl"
              />
            </div>

            {/* تاريخ بداية العقد - من */}
            <div className="space-y-2">
              <Label className="text-right">تاريخ بداية العقد (من)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal h-9"
                  >
                    <CalendarIconLucide className="ml-2 h-4 w-4" />
                    {startDateFrom ? (
                      format(startDateFrom, "MMM d, yyyy")
                    ) : (
                      "اختر التاريخ"
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
            </div>
          </div>

          {/* أزرار التطبيق والإعادة */}
          <div className="flex justify-end space-x-2 pt-2" dir="ltr">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetFilters}
              className="h-8"
            >
              <X className="ml-1 h-3 w-3" />
              مسح الكل
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