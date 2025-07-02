
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import type { CustomerInfo } from '@/types/customer';
import { MoreVertical, Phone, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerCardProps {
  customer: CustomerInfo;
  onEdit?: (customer: CustomerInfo) => void;
  onDelete?: (customerId: string) => void;
  onSelect?: (customer: CustomerInfo) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onSelect
}) => {
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(customer);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'under_review':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'under_review':
        return 'قيد المراجعة';
      case 'blacklisted':
        return 'محظور';
      default:
        return status;
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={handleCardClick}
      dir="rtl"
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
            <Badge variant={getStatusVariant(customer.status)} className="text-xs px-3 py-1">
              {getStatusText(customer.status)}
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
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(customer); }} className="text-right">
                    تعديل العميل
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive text-right"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`هل أنت متأكد من حذف ${customer.full_name}؟`)) {
                        onDelete(customer.id!);
                      }
                    }}
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
                  {customer.phone || customer.phone_number || 'غير متوفر'}
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
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {customer.email && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${customer.email}`, '_blank');
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${customer.phone}`, '_blank');
                }}
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
};
