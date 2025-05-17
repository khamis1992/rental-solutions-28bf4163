
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerInfo } from '@/types/customer';
import { supabase } from '@/lib/supabase';

interface CustomerSectionProps {
  customer?: CustomerInfo;
  customerId?: string;
  onEdit?: () => void;
}

const CustomerSection = ({
  customer: initialCustomer,
  customerId,
  onEdit
}: CustomerSectionProps) => {
  const [customer, setCustomer] = React.useState<CustomerInfo | null>(initialCustomer || null);
  const [loading, setLoading] = React.useState<boolean>(!initialCustomer && !!customerId);

  React.useEffect(() => {
    if (customerId && !initialCustomer) {
      // Fetch customer data if we only have the ID
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', customerId)
            .single();
          
          if (error) throw error;
          
          if (data) {
            const customerData: CustomerInfo = {
              id: data.id,
              full_name: data.full_name || '',
              email: data.email || '',
              phone_number: data.phone_number || '',
              driver_license: data.driver_license || '',
              nationality: data.nationality || '',
              address: data.address || ''
            };
            setCustomer(customerData);
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomer();
    } else if (initialCustomer) {
      setCustomer(initialCustomer);
    }
  }, [customerId, initialCustomer]);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md bg-gray-50 rounded-md">
        <CardHeader className="pb-4">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-48 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
            <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md bg-gray-50 rounded-md">
        <CardHeader className="pb-4 bg-gray-50 rounded-md">
          <CardTitle className="text-xl">Customer information unavailable</CardTitle>
        </CardHeader>
        <CardContent className="bg-gray-50 rounded-md">
          <p className="text-muted-foreground">Customer information could not be loaded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md bg-gray-50 rounded-md">
      <CardHeader className="pb-4 bg-gray-50 rounded-md">
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
          {onEdit && <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Details
            </Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-gray-50 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="flex-grow">{customer.email}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(customer.email, 'Email')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="flex-grow">{customer.phone_number}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(customer.phone_number, 'Phone')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {customer.address && <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-grow">{customer.address}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(customer.address, 'Address')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Documents & Details</h3>
            <div className="space-y-3">
              {customer.driver_license && <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Driver License: {customer.driver_license}</span>
                </div>}
              {customer.nationality && <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Nationality: {customer.nationality}</span>
                </div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;
