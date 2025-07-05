
import React from 'react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MaintenanceRecordProps {
  record: any;
  onClick?: () => void;
}

export const MaintenanceRecord: React.FC<MaintenanceRecordProps> = ({ record, onClick }) => {
  return (
    <Card 
      className={`border-l-4 ${getStatusColor(record.status)} hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{record.service_type}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(record.service_date)}
            </p>
          </div>
          <Badge variant={getStatusVariant(record.status)}>
            {record.status}
          </Badge>
        </div>
        
        {record.description && (
          <p className="text-sm mt-2 line-clamp-2">{record.description}</p>
        )}
        
        <div className="flex justify-between mt-2 text-sm">
          <span>Cost: {formatCurrency(record.cost || 0)}</span>
          {record.odometer && <span>Odometer: {record.odometer} km</span>}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions for styling based on status
function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'border-green-500';
    case 'scheduled':
      return 'border-blue-500';
    case 'in-progress':
      return 'border-amber-500';
    case 'cancelled':
      return 'border-red-500';
    default:
      return 'border-gray-500';
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'scheduled':
      return 'default';
    case 'in-progress':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}
