import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/use-customers';
import { RefreshCw, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nationality?: string;
}

interface CustomerSelectorForLegalProps {
  onCustomerSelect: (customer: CustomerData) => void;
  selectedCustomer: CustomerData | null;
  disabled?: boolean;
}

export const CustomerSelectorForLegal: React.FC<CustomerSelectorForLegalProps> = ({
  onCustomerSelect,
  selectedCustomer,
  disabled = false
}) => {
  const { customers, isLoading: loadingCustomers, error, refreshCustomers } = useCustomers();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Transform customers to expected format
  const transformedCustomers = customers?.map(customer => ({
    id: customer.id || '',
    full_name: customer.full_name || 'اسم غير محدد',
    phone: customer.phone || 'رقم غير محدد',
    email: customer.email || '',
    address: customer.address || '',
    nationality: customer.nationality || ''
  })) || [];

  const handleCustomerChange = (customerId: string) => {
    const customer = transformedCustomers.find(c => c.id === customerId);
    if (customer) {
      onCustomerSelect({
        id: customer.id,
        name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        nationality: customer.nationality
      });
      toast.success(`تم اختيار العميل: ${customer.full_name}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCustomers();
      toast.success('تم تحديث قائمة العملاء بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث العملاء:', error);
      toast.error('فشل في تحديث قائمة العملاء');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-retry when there's an error
  useEffect(() => {
    if (error && !loadingCustomers) {
      console.log('محاولة إعادة تحميل العملاء بسبب خطأ...');
      setTimeout(() => {
        handleRefresh();
      }, 2000);
    }
  }, [error, loadingCustomers]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Label htmlFor="customer" className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          اختيار العميل
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loadingCustomers || isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(loadingCustomers || isRefreshing) ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Error State */}
      {error && !loadingCustomers && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">خطأ في تحميل العملاء</p>
                <p className="text-sm">{error?.message || 'حدث خطأ غير معروف'}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="mt-2"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Selection */}
      <div className="space-y-2">
        <Select 
          onValueChange={handleCustomerChange} 
          disabled={loadingCustomers || disabled}
          value={selectedCustomer?.id || ''}
        >
          <SelectTrigger className="text-right h-12" dir="rtl">
            <SelectValue 
              placeholder={
                loadingCustomers 
                  ? "جاري تحميل العملاء..." 
                  : transformedCustomers.length === 0 
                    ? "لا توجد عملاء متاحين"
                    : "اختر العميل من القائمة"
              } 
            />
          </SelectTrigger>
          <SelectContent className="text-right max-h-60" dir="rtl">
            {transformedCustomers.length > 0 ? (
              transformedCustomers.map((customer) => (
                <SelectItem 
                  key={customer.id} 
                  value={customer.id} 
                  className="text-right cursor-pointer"
                >
                  <div className="flex flex-col text-right w-full">
                    <span className="font-medium text-gray-900">
                      {customer.full_name}
                    </span>
                    <span className="text-sm text-gray-500 ltr-text" dir="ltr">
                      {customer.phone}
                    </span>
                    {customer.email && (
                      <span className="text-xs text-gray-400 ltr-text" dir="ltr">
                        {customer.email}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : !loadingCustomers ? (
              <SelectItem value="no-customers" disabled>
                لا توجد عملاء متاحين
              </SelectItem>
            ) : null}
          </SelectContent>
        </Select>

        {/* Loading State */}
        {loadingCustomers && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            جاري تحميل العملاء...
          </div>
        )}

        {/* Success State */}
        {transformedCustomers.length > 0 && !loadingCustomers && !error && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            تم العثور على {transformedCustomers.length} عميل
          </div>
        )}
      </div>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                بيانات العميل المحددة
              </h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                محدد
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <span className="font-medium text-gray-700">الاسم:</span>
                <p className="text-gray-900">{selectedCustomer.name}</p>
              </div>
              <div className="space-y-1">
                <span className="font-medium text-gray-700">الهاتف:</span>
                <p className="text-gray-900 ltr-text" dir="ltr">{selectedCustomer.phone}</p>
              </div>
              {selectedCustomer.email && (
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                  <p className="text-gray-900 ltr-text" dir="ltr">{selectedCustomer.email}</p>
                </div>
              )}
              {selectedCustomer.nationality && (
                <div className="space-y-1">
                  <span className="font-medium text-gray-700">الجنسية:</span>
                  <p className="text-gray-900">{selectedCustomer.nationality}</p>
                </div>
              )}
              {selectedCustomer.address && (
                <div className="space-y-1 md:col-span-2">
                  <span className="font-medium text-gray-700">العنوان:</span>
                  <p className="text-gray-900">{selectedCustomer.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 