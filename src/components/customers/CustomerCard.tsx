
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    return new Date(dateString).toLocaleDateString('ar-SA');
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
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">
                  {customer.full_name || 'غير معروف'}
                </h3>
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {getInitials(customer.full_name || 'غير معروف')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CustomerStatusBadge status={customer.status} size="sm" />
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
                <Link to={`/customers/${customer.id}`} className="flex items-center">
                  <User className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(customer); }}>
                  تعديل العميل
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
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

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
              <Mail className="h-4 w-4 text-primary/60" />
              <span className="truncate">{customer.email || 'غير متوفر'}</span>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
              <Phone className="h-4 w-4 text-primary/60" />
              <span className="phone-number-ltr" dir="ltr">{customer.phone || customer.phone_number || 'غير متوفر'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-primary/60" />
            <span>تاريخ الإضافة: {formatDate(customer.created_at)}</span>
          </div>

          {customer.driver_license && (
            <div className="pt-2 border-t border-gray-100">
              <Badge variant="outline" className="text-xs">
                رخصة القيادة: {customer.driver_license}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
