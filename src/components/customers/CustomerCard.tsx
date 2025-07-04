import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Customer } from '@/lib/validation-schemas/customer';
import { MoreVertical, Phone, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onSelect?: (customer: Customer) => void;
}

// Memoized helper functions to prevent recreation
const statusVariantMap = {
  active: 'default',
  inactive: 'secondary',
  under_review: 'outline',
  default: 'secondary'
} as const;

const statusTextMap = {
  active: 'نشط',
  inactive: 'غير نشط',
  under_review: 'قيد المراجعة',
  blacklisted: 'محظور'
} as const;

export const CustomerCard: React.FC<CustomerCardProps> = memo(({
  customer,
  onEdit,
  onDelete,
  onSelect
}) => {
  // Memoized status variant
  const statusVariant = useMemo(() => 
    statusVariantMap[customer.status as keyof typeof statusVariantMap] || statusVariantMap.default,
    [customer.status]
  );

  // Memoized status text
  const statusText = useMemo(() => 
    statusTextMap[customer.status as keyof typeof statusTextMap] || customer.status,
    [customer.status]
  );

  // Memoized formatted date
  const formattedDate = useMemo(() => 
    new Date().toLocaleDateString('ar-SA'),
    [] // Empty dependencies as we want daily updates
  );

  // Memoized handlers
  const handleCardClick = useCallback(() => {
    if (onSelect) {
      onSelect(customer);
    }
  }, [onSelect, customer]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(customer);
    }
  }, [onEdit, customer]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`هل أنت متأكد من حذف ${customer.full_name}؟`)) {
      onDelete?.(customer.id!);
    }
  }, [onDelete, customer.id, customer.full_name]);

  const handleEmailClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`mailto:${customer.email}`, '_blank');
  }, [customer.email]);

  const handlePhoneClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${customer.phone}`, '_blank');
  }, [customer.phone]);

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={handleCardClick}
      dir="rtl"
      data-testid="customer-card"
    >
      <CardContent className="p-5">
        {/* Header with name and status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="text-right">
              <h3 className="font-semibold text-lg leading-tight break-words whitespace-normal max-w-full overflow-hidden mb-1">
                {customer.full_name || 'غير معروف'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {customer.email || 'بدون بريد إلكتروني'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant} className="text-xs px-3 py-1">
              {statusText}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[160px]">
                <DropdownMenuItem asChild>
                  <Link to={`/customers/${customer.id}`} className="flex items-center gap-2 text-right">
                    <User className="h-4 w-4" />
                    عرض التفاصيل
                  </Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={handleEdit} className="text-right">
                    تعديل العميل
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive text-right"
                    onClick={handleDelete}
                  >
                    حذف العميل
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Customer Information Section */}
        <div className="space-y-4">
          
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-gray-700 mb-3 border-b border-gray-200 pb-2">
              معلومات الاتصال
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">رقم الهاتف</span>
                <span className="text-sm font-medium text-left" dir="ltr">
                  {customer.phone || 'غير متوفر'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
                <span className="text-sm font-medium text-left truncate max-w-[150px]" dir="ltr">
                  {customer.email || 'غير متوفر'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-blue-700 mb-3 border-b border-blue-200 pb-2">
              البيانات الشخصية
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الجنسية</span>
                <span className="text-sm font-medium">
                  {customer.nationality || 'غير محددة'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">رخصة القيادة</span>
                <span className="text-sm font-medium text-left font-mono" dir="ltr">
                  {customer.driver_license || 'غير متوفر'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions Bar */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              آخر تحديث: {formattedDate}
            </p>
          </div>
          
          <div className="flex gap-2">
            {customer.email && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleEmailClick}
              >
                <Mail className="h-3 w-3 ml-1" />
                إيميل
              </Button>
            )}
            
            {customer.phone && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handlePhoneClick}
              >
                <Phone className="h-3 w-3 ml-1" />
                اتصال
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
