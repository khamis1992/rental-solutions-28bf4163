
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, FileText, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerInfo } from '@/types/customer';

interface CustomerSectionProps {
  customer: CustomerInfo;
  onEdit?: () => void;
}

const CustomerSection = ({ customer, onEdit }: CustomerSectionProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <User className="h-8 w-8" />
            </Avatar>
            <div>
              <CardTitle className="text-xl">{customer.full_name}</CardTitle>
              <CardDescription>Customer ID: {customer.id}</CardDescription>
            </div>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="flex-grow">{customer.email}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(customer.email, 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="flex-grow">{customer.phone_number}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(customer.phone_number, 'Phone')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-grow">{customer.address}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(customer.address, 'Address')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Documents & Details</h3>
            <div className="space-y-3">
              {customer.driver_license && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Driver License: {customer.driver_license}</span>
                </div>
              )}
              {customer.nationality && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Nationality: {customer.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;
