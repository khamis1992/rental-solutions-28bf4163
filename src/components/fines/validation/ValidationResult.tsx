
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export interface ValidationResultProps {
  result: {
    isValid: boolean;
    message: string;
    details?: any;
    timestamp?: Date;
  };
  licensePlate: string;
}

const ValidationResult: React.FC<ValidationResultProps> = ({ result, licensePlate }) => {
  const timestamp = result.timestamp || new Date();

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center">
          <div className="mr-4">
            {result.isValid ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <div>
            <p className="font-medium mb-1">
              License Plate: <span className="font-bold">{licensePlate}</span>
            </p>
            <p className={result.isValid ? "text-green-600" : "text-red-600"}>
              {result.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Validated on {format(timestamp, 'PPpp')}
            </p>
          </div>
        </div>

        {result.details && (
          <div className="mt-4 pt-4 border-t">
            <p className="font-medium mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Additional Details
            </p>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
              {typeof result.details === 'string' 
                ? result.details
                : JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationResult;
