
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { ValidationResult } from '@/hooks/use-traffic-fines-validation';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

interface TrafficFineValidationResultProps {
  result: ValidationResult;
}

export const TrafficFineValidationResult: React.FC<TrafficFineValidationResultProps> = ({ 
  result 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Validation Result</span>
          <Badge className={result.hasFine ? "bg-red-500" : "bg-green-500"}>
            {result.hasFine ? (
              <>
                <X className="h-3 w-3 mr-1" /> Fine Found
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" /> No Fine
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground">License Plate</h4>
            <p className="text-base">{result.licensePlate}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground">Validation Date</h4>
            <p className="text-base">{formatDate(new Date(result.validationDate))}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground">Validation Source</h4>
            <p className="text-base">{result.validationSource}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground">Status</h4>
            <p className="text-base">{result.hasFine ? "Fine found in system" : "No fine found"}</p>
          </div>
        </div>
        
        {result.hasFine && result.fineDetails && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">Fine Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Amount</h4>
                <p className="text-base">{formatCurrency(result.fineDetails.amount)}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Violation Date</h4>
                <p className="text-base">{formatDate(new Date(result.fineDetails.violationDate))}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Violation Type</h4>
                <p className="text-base">{result.fineDetails.violationType}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Location Code</h4>
                <p className="text-base">{result.fineDetails.locationCode}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
