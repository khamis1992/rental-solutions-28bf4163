import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { Customer } from '@/lib/validation-schemas/customer';
import { MoreVertical, Phone, Mail, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onSelect?: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onSelect
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير متوفر';
    return new Date(dateString).toLocaleDateString('ar-QA');
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(customer);
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 border-r-4 border-r-primary/20 hover:border-r-primary cursor-pointer h-full"
      onClick={handleCardClick}
      dir="rtl"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-row-reverse">
            <Avatar className="h-12 w-12 border-2 border-primary/10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {getInitials(customer.full_name || 'غير معروف')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1 min-w-0 text-right">
              <CardTitle className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors truncate">
                {customer.full_name || 'غير معروف'}
              </CardTitle>
              <div className="flex justify-start">
                <CustomerStatusBadge status={customer.status} size="sm" />
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px]" dir="rtl">
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
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-row-reverse flex-1 min-w-0">
              <Mail className="h-4 w-4 text-primary/60 flex-shrink-0" />
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-medium truncate">{customer.email || 'غير متوفر'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-row-reverse flex-1 min-w-0">
              <Phone className="h-4 w-4 text-primary/60 flex-shrink-0" />
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium phone-number-ltr" dir="ltr">{customer.phone || 'غير متوفر'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-row-reverse flex-1 min-w-0">
              <Calendar className="h-4 w-4 text-primary/60 flex-shrink-0" />
              <div className="text-right flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                <p className="font-medium">{formatDate(customer.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {customer.driver_license && (
          <div className="pt-3 border-t border-gray-100">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-right">
                <h4 className="font-medium text-blue-900 text-sm">رخصة القيادة</h4>
                <p className="text-sm text-blue-700 mt-1 font-mono">
                  {customer.driver_license}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
