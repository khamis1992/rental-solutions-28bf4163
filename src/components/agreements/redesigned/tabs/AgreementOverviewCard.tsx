
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agreement } from '@/types/agreement';
import { User, Car, DollarSign, Clock } from 'lucide-react';

interface AgreementOverviewCardProps {
  agreement: Agreement;
  duration: number;
  rentAmount: number | null;
  contractAmount: number | null;
}

// Helper function to format currency without unnecessary decimals
const formatCurrency = (amount: number | null): string => {
  if (!amount) return 'N/A';
  const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  return `QAR ${formatted}`;
};

export function AgreementOverviewCard({ 
  agreement, 
  duration,
  rentAmount,
  contractAmount
}: AgreementOverviewCardProps) {
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
                  {formatCurrency(rentAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Customer & Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer & Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Customer Information
              </h3>
              <div className="space-y-3">
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
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Car className="h-5 w-5 text-green-500" />
                Vehicle Information
              </h3>
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
