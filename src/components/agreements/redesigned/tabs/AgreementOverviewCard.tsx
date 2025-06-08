
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agreement } from '@/types/agreement';
import { CalendarDays, User, Car, DollarSign, Clock } from 'lucide-react';

interface AgreementOverviewCardProps {
  agreement: Agreement;
  duration: number;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
}

export function AgreementOverviewCard({ 
  agreement, 
  duration,
  rentAmount,
  contractAmount
}: AgreementOverviewCardProps) {
  const startDate = agreement.start_date instanceof Date ? agreement.start_date : new Date(agreement.start_date);
  const endDate = agreement.end_date instanceof Date ? agreement.end_date : new Date(agreement.end_date);

  return (
    <div className="space-y-6">
      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/10 rounded-full p-2">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold truncate">
                  {agreement.customers?.full_name || 'Unknown Customer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/10 rounded-full p-2">
                <Car className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-semibold truncate">
                  {agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'Unknown Vehicle'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500/10 rounded-full p-2">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {duration} {duration === 1 ? 'month' : 'months'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Amount */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500/10 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="font-semibold">
                  {rentAmount ? `$${rentAmount.toFixed(2)}` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{agreement.customers?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{agreement.customers?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{agreement.customers?.phone_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{agreement.customers?.address || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Make & Model</p>
              <p className="font-medium">
                {agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="font-medium">{agreement.vehicles?.license_plate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Year</p>
              <p className="font-medium">{agreement.vehicles?.year || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Color</p>
              <p className="font-medium">{agreement.vehicles?.color || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agreement Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Agreement Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Rental Period</p>
                <p className="font-medium">
                  {format(startDate, "MMMM d, yyyy")} to {format(endDate, "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Duration: {duration} {duration === 1 ? 'month' : 'months'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Agreement Status</p>
                <Badge 
                  variant={agreement.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {agreement.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Financial Details</p>
                <p className="font-medium">
                  Monthly Rent: {rentAmount ? `$${rentAmount.toFixed(2)}` : 'N/A'}
                </p>
                <p className="font-medium">
                  Contract Amount: {contractAmount ? `$${contractAmount.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Agreement Number</p>
                <p className="font-medium">{agreement.agreement_number || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
