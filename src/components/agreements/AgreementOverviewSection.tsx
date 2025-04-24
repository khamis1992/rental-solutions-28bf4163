
import React from 'react';
import { Link } from 'react-router-dom';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { FileText, FileCheck, FileX, FileClock, FileEdit, Car, User, Calendar, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AgreementOverviewSectionProps {
  agreement: Agreement;
  rentAmount: number | null;
  contractAmount: number | null;
  onDelete?: () => void;
  onEdit?: () => void;
}

export const AgreementOverviewSection: React.FC<AgreementOverviewSectionProps> = ({
  agreement,
  rentAmount,
  contractAmount,
  onDelete,
  onEdit
}) => {
  // Calculate the agreement progress
  const startDate = new Date(agreement.start_date);
  const endDate = new Date(agreement.end_date);
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate);
  const daysPassed = differenceInDays(today, startDate);
  
  // Ensure the progress is between 0 and 100
  const progress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  
  // Format dates for display
  const formattedStartDate = format(new Date(agreement.start_date), 'MMM d, yyyy');
  const formattedEndDate = format(new Date(agreement.end_date), 'MMM d, yyyy');
  
  // Badge and icon based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case AgreementStatus.ACTIVE:
        return "success";
      case AgreementStatus.DRAFT:
        return "secondary";
      case AgreementStatus.PENDING:
        return "warning";
      case AgreementStatus.EXPIRED:
        return "outline";
      default:
        return "destructive";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case AgreementStatus.ACTIVE:
        return <FileCheck className="h-4 w-4 mr-1" />;
      case AgreementStatus.DRAFT:
        return <FileEdit className="h-4 w-4 mr-1" />;
      case AgreementStatus.PENDING:
        return <FileClock className="h-4 w-4 mr-1" />;
      case AgreementStatus.EXPIRED:
        return <FileText className="h-4 w-4 mr-1" />;
      default:
        return <FileX className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Agreement #{agreement.agreement_number}
              </h2>
              <Badge 
                variant={getBadgeVariant(agreement.status)}
                className="capitalize flex items-center px-2 py-1"
              >
                {getStatusIcon(agreement.status)}
                {agreement.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Customer
                </span>
                <span className="font-medium">
                  {agreement.customer_id ? (
                    <Link to={`/customers/${agreement.customer_id}`} className="text-primary hover:underline">
                      {agreement.customers?.full_name || 'Unknown Customer'}
                    </Link>
                  ) : 'No customer assigned'}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  Vehicle
                </span>
                <span className="font-medium">
                  {agreement.vehicle_id ? (
                    <Link to={`/vehicles/${agreement.vehicle_id}`} className="text-primary hover:underline">
                      {agreement.vehicles ? 
                        `${agreement.vehicles.make} ${agreement.vehicles.model} (${agreement.vehicles.license_plate})` :
                        `Vehicle ID: ${agreement.vehicle_id}`
                      }
                    </Link>
                  ) : 'No vehicle assigned'}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Period
                </span>
                <span className="font-medium">
                  {formattedStartDate} – {formattedEndDate}
                </span>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Monthly Rent
                </span>
                <span className="font-medium">
                  {rentAmount ? formatCurrency(rentAmount) : 'Not set'}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Agreement Progress</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formattedStartDate}</span>
                <span>{formattedEndDate}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                Edit Agreement
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete} className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Delete Agreement
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
