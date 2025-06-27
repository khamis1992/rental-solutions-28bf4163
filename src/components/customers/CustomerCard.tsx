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
      className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary cursor-pointer"
      onClick={handleCardClick}
      dir="rtl"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Avatar className="h-12 w-12 border-2 border-primary/10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {getInitials(customer.full_name || 'غير معروف')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors truncate text-left">
                {customer.full_name || 'غير معروف'}
              </CardTitle>
              <div className="text-left">
                <CustomerStatusBadge status={customer.status} size="sm" />
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[160px] text-right">
              <DropdownMenuItem asChild>
                <Link to={`/customers/${customer.id}`} className="flex items-center flex-row-reverse">
                  <User className="h-4 w-4 mr-2" />
                  عرض التفاصيل
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(customer); }} className="text-left">
                  تعديل العميل
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive text-left"
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
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-muted-foreground text-left">البريد الإلكتروني</p>
              <p className="font-medium text-left truncate">{customer.email || 'غير متوفر'}</p>
            </div>
            <Mail className="h-4 w-4 text-primary/60 flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-muted-foreground text-left">رقم الهاتف</p>
              <p className="font-medium text-left phone-number-ltr" dir="ltr">{customer.phone || 'غير متوفر'}</p>
            </div>
            <Phone className="h-4 w-4 text-primary/60 flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-muted-foreground text-left">تاريخ الإضافة</p>
              <p className="font-medium text-left">{formatDate(customer.created_at)}</p>
            </div>
            <Calendar className="h-4 w-4 text-primary/60 flex-shrink-0" />
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
