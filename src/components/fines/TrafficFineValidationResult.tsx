
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, AlertTriangle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ValidationResult } from '@/hooks/use-traffic-fines-validation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TrafficFineValidationResultProps {
  result: ValidationResult;
}

export const TrafficFineValidationResult: React.FC<TrafficFineValidationResultProps> = ({ result }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Validation Result
          <Badge className={result.hasFine ? "bg-red-500" : "bg-green-500"}>
            {result.hasFine ? "Fine Found" : "No Fine Found"}
          </Badge>
        </CardTitle>
        <CardDescription>
          License Plate: {result.licensePlate} • Validation Source: {result.validationSource}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {result.hasFine && result.fineDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Amount</h4>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(result.fineDetails.amount)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Violation Date</h4>
                    <p>{formatDate(new Date(result.fineDetails.violationDate))}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Violation Type</h4>
                  <p>{result.fineDetails.violationType}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-1">Location Code</h4>
                  <p>{result.fineDetails.locationCode}</p>
                </div>
              </div>
            )}

            {!result.hasFine && (
              <div className="flex items-center p-4 bg-green-50 rounded-md text-green-700">
                <Check className="h-6 w-6 mr-2" />
                <p>No traffic fines were found for this license plate in the system.</p>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Information</AlertTitle>
              <AlertDescription>
                Validation performed on {formatDate(new Date(result.validationDate))}
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};
