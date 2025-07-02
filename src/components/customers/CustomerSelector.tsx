import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Check, ChevronsUpDown, Loader2, RefreshCw, AlertCircle, User } from 'lucide-react';

import { CustomerInfo } from '@/types/customer';
import { useCustomerSelectorService } from '@/hooks/services/useCustomerSelectorService';
import { toast } from 'sonner';

interface CustomerSelectorProps {
  onCustomerSelect: (customer: CustomerInfo) => void;
  selectedCustomer: CustomerInfo | null;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CustomerSelector = ({
  onCustomerSelect,
  selectedCustomer,
  inputClassName,
  placeholder = "البحث عن عميل...",
  disabled = false
}: CustomerSelectorProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  
  const {
    customers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refreshCustomers
  } = useCustomerSelectorService();

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('تم تحديد استعلام البحث إلى:', internalSearchQuery);
      setSearchQuery(internalSearchQuery);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [internalSearchQuery, setSearchQuery]);

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error('خطأ في أداة اختيار العميل:', error);
    }
  }, [error]);

  // Filter customers based on search query locally for better UX
  const filteredCustomers = customers.filter(customer => {
    if (!internalSearchQuery.trim()) return true;
    
    const searchTerm = internalSearchQuery.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone_number.toLowerCase().includes(searchTerm)
    );
  });

  // Handle customer selection
  const handleSelect = (customerSearchText: string): void => {
    // Extract customer ID from the search text format: "name|email|phone|id"
    const parts = customerSearchText.split('|');
    const customerId = parts[parts.length - 1]; // ID is always last
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      console.log('تم اختيار العميل:', customer);
      onCustomerSelect(customer);
      toast.success(`تم اختيار العميل: ${customer.full_name}`);
    }
    setOpen(false);
    setInternalSearchQuery(''); // Clear search after selection
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      console.log('تم تشغيل التحديث اليدوي');
      await refreshCustomers();
      toast.success('تم تحديث قائمة العملاء');
    } catch (error) {
      console.error('خطأ في التحديث:', error);
      toast.error('فشل في تحديث قائمة العملاء');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Ensure phone numbers display LTR
    return phone ? `\u202D${phone}\u202C` : '';
  };

  return (
    <div dir="rtl">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "justify-between w-full text-right",
              inputClassName,
              selectedCustomer && "border-green-500 bg-green-50"
            )}
            dir="rtl"
          >
            <div className="flex items-center gap-2 flex-row-reverse">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedCustomer ? selectedCustomer.full_name : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full min-w-[350px]" align="start" sideOffset={4}>
          <Command shouldFilter={false} dir="rtl">
            <div className="flex items-center border-b px-3">
              <CommandInput
                placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني..."
                onValueChange={(value) => {
                  console.log('تم تغيير إدخال البحث:', value);
                  setInternalSearchQuery(value);
                }}
                value={internalSearchQuery}
                className="flex-1 text-right"
                dir="rtl"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="ml-2 h-8 w-8 p-0"
                disabled={isLoading}
                title="تحديث قائمة العملاء"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="mr-2 text-sm text-muted-foreground">جاري تحميل العملاء...</span>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center py-6 px-3 space-y-3">
                  <div className="flex items-center text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 ml-2" />
                    خطأ في تحميل قائمة العملاء
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="text-xs"
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              )}
              {!isLoading && !error && filteredCustomers.length === 0 && (
                <CommandEmpty className="text-center py-6 text-right">
                  {internalSearchQuery.trim() 
                    ? `لا توجد عملاء تطابق "${internalSearchQuery}"`
                    : 'لا توجد عملاء متاحون.'
                  }
                </CommandEmpty>
              )}
              {!error && (
                <CommandGroup>
                  {!isLoading && filteredCustomers.map((customer) => {
                    // Create a searchable value that includes name, email, phone, and ID
                    const searchableValue = `${customer.full_name}|${customer.email}|${customer.phone_number}|${customer.id}`;
                    
                    return (
                      <CommandItem
                        key={customer.id}
                        value={searchableValue}
                        onSelect={() => handleSelect(searchableValue)}
                        className={cn(
                          "flex items-center justify-between cursor-pointer p-3 border-b last:border-b-0",
                          selectedCustomer?.id === customer.id && "bg-green-50 border-green-200"
                        )}
                        dir="rtl"
                      >
                        <div className="flex-1 text-right">
                          <div className="font-medium text-gray-900">
                            {customer.full_name}
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            {customer.phone_number && (
                              <div className="ltr-text" dir="ltr">
                                الهاتف: {formatPhoneNumber(customer.phone_number)}
                              </div>
                            )}
                            {customer.email && (
                              <div className="ltr-text" dir="ltr">
                                البريد: {customer.email}
                              </div>
                            )}
                            {customer.nationality && (
                              <div>
                                الجنسية: {customer.nationality}
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomerSelector;
