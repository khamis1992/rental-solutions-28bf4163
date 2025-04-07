
import React, { useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { useTrafficFinesValidation } from '@/hooks/use-traffic-fines-validation';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export const TrafficFineValidationHistory: React.FC = () => {
  const { getValidationHistory } = useTrafficFinesValidation();

  // Fetch validation history when component loads
  useEffect(() => {
    getValidationHistory.refetch();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Validation History</CardTitle>
            <CardDescription>
              Recent traffic fine validation attempts
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={() => getValidationHistory.refetch()}
            disabled={getValidationHistory.isRefetching}
          >
            {getValidationHistory.isRefetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {getValidationHistory.isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> 
            <span>Loading validation history...</span>
          </div>
        ) : getValidationHistory.isError ? (
          <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
            <AlertTriangle className="h-5 w-5 mb-2" />
            <p className="font-semibold">Error loading validation history</p>
            <p className="text-sm">{getValidationHistory.error instanceof Error 
              ? getValidationHistory.error.message 
              : "Unknown error"}
            </p>
          </div>
        ) : getValidationHistory.data?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No validation history found.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getValidationHistory.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.validationDate)}</TableCell>
                    <TableCell>{item.result.licensePlate}</TableCell>
                    <TableCell>
                      <Badge className={item.result.hasFine ? "bg-red-500" : "bg-green-500"}>
                        {item.result.hasFine ? (
                          <>
                            <X className="h-3 w-3 mr-1" /> Fine Found
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" /> No Fine
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.result.hasFine && item.result.fineDetails ? (
                        <span>
                          {formatCurrency(item.result.fineDetails.amount)} - 
                          {item.result.fineDetails.violationType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No fine details</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
