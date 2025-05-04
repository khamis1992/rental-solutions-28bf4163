
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export interface ValidationResult {
  id?: string;
  licensePlate: string;
  isValid: boolean;
  message: string;
  details?: any;
  timestamp?: Date;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
}

export interface ValidationHistoryProps {
  history: ValidationResult[];
}

const ValidationHistory: React.FC<ValidationHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No validation history available. Validate some license plates to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <Card key={item.id || index} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="mr-4">
                {item.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    License Plate: <span className="font-bold">{item.licensePlate}</span>
                  </div>
                  <Badge variant={item.isValid ? "success" : "destructive"}>
                    {item.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {item.timestamp ? format(new Date(item.timestamp), 'PPp') :
                   item.validationDate ? format(new Date(item.validationDate), 'PPp') : 'Unknown time'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ValidationHistory;
