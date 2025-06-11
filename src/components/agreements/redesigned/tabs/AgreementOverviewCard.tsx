import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, User, Car, Clock } from 'lucide-react';
import { CustomerInformationCard } from '../../details/CustomerInformationCard';
import { VehicleInformationCard } from '../../details/VehicleInformationCard';

interface AgreementOverviewCardProps {
  agreement: any;
  duration: number;
  rentAmount: number;
}

export function AgreementOverviewCard({ 
  agreement, 
  duration, 
  rentAmount 
}: AgreementOverviewCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Information Card */}
      <CustomerInformationCard agreement={agreement} />

      {/* Vehicle Information Card */}
      <VehicleInformationCard agreement={agreement} />

      {/* Agreement Details Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Agreement Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(agreement.start_date).toLocaleDateString()} - {new Date(agreement.end_date).toLocaleDateString()} ({duration} months)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{rentAmount} / month</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{agreement.customers?.full_name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>{agreement.vehicles?.make} {agreement.vehicles?.model}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Created at: {new Date(agreement.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
