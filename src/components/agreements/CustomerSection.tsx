import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, FileText, User, Calendar } from 'lucide-react';
import { CustomerInfo } from '@/types/customer';

interface CustomerSectionProps {
  customer: CustomerInfo | null;
}

const CustomerSection = ({ customer }: CustomerSectionProps) => {
  if (!customer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No customer selected</p>
        </CardContent>
      </Card>
    );
  }

  const formatDisplayValue = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) {
      return 'Not provided';
    }
    return String(value);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'Not provided';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="font-medium">{customer.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="font-medium">{customer.phone_number || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Driver License</p>
                <p className="font-medium">{customer.driver_license || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nationality</p>
                <p className="font-medium">{customer.nationality || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="font-medium">{customer.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;
