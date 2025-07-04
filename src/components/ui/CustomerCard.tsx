import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, CreditCard, MapPin } from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  className?: string;
}

export function CustomerCard({ customer, onClick, className }: CustomerCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
      data-testid="customer-card"
      dir="rtl"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer.full_name || 'غير محدد'}
          </CardTitle>
          {customer.status && (
            <Badge className={getStatusColor(customer.status)}>
              {customer.status === 'active' ? 'نشط' : 
               customer.status === 'suspended' ? 'معلق' : 
               customer.status === 'inactive' ? 'غير نشط' : customer.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500" />
          <span>{customer.phone || 'غير محدد'}</span>
        </div>
        
        {customer.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>{customer.email}</span>
          </div>
        )}
        
        {customer.driver_license && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>رخصة القيادة: {customer.driver_license}</span>
          </div>
        )}
        
        {customer.nationality && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>الجنسية: {customer.nationality}</span>
          </div>
        )}
        
        {customer.address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>العنوان: {customer.address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
