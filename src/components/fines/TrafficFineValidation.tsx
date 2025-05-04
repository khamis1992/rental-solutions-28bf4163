
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Refresh, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
// Remove the conflicting import
// import { ValidationResultType } from '@/services/traffic-fine/types';

// Define the type locally to avoid conflicts
export interface ValidationResultType {
  isValid: boolean;
  message: string;
  licensePlate?: string;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
  details?: string;
  validationId?: string;
}

export const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState('');
  const [validationSource, setValidationSource] = useState('metrash');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResultType>({
    isValid: false,
    message: '',
    hasFine: false
  });
  
  const handleValidation = async () => {
    if (!licensePlate.trim()) {
      toast.error('Please enter a license plate number');
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Simulate validation process - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Example result - replace with actual validation logic
      const result: ValidationResultType = {
        isValid: true,
        message: 'Validation completed successfully',
        licensePlate,
        validationDate: new Date(),
        validationSource,
        hasFine: Math.random() > 0.5,
        details: Math.random() > 0.5 ? 'Speed violation detected' : undefined,
        validationId: Math.random().toString(36).substring(2, 11)
      };
      
      setValidationResult(result);
      
      if (result.hasFine) {
        toast.warning(`Fine found for ${licensePlate}`);
      } else {
        toast.success(`No fines found for ${licensePlate}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Error during validation. Please try again.');
      
      setValidationResult({
        isValid: false,
        message: 'Validation failed due to an error',
        licensePlate,
        validationDate: new Date(),
        validationSource
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Validate Traffic Fines</CardTitle>
        <CardDescription>Check license plate for outstanding fines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input 
            id="licensePlate"
            placeholder="Enter license plate number"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            disabled={isValidating}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Validation Source</Label>
          <Select 
            value={validationSource} 
            onValueChange={setValidationSource}
            disabled={isValidating}
          >
            <SelectTrigger id="source">
              <SelectValue placeholder="Select validation source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="metrash">Metrash</SelectItem>
              <SelectItem value="moi">Ministry of Interior</SelectItem>
              <SelectItem value="traffic_dept">Traffic Department</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {validationResult.isValid && (
          <div className="mt-4 rounded-md border p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validation Date:</span>
                <span>{validationResult.validationDate ? format(validationResult.validationDate, 'MMM dd, yyyy HH:mm') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validation ID:</span>
                <span>{validationResult.validationId || 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={validationResult.hasFine ? 'destructive' : 'success'}>
                  {validationResult.hasFine ? 'Fine Found' : 'No Fines'}
                </Badge>
              </div>
              {validationResult.details && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm font-medium">Details:</p>
                  <p className="text-sm text-muted-foreground">{validationResult.details}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {validationResult.isValid === false && validationResult.message && (
          <div className="flex items-center text-amber-500 gap-2 text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{validationResult.message}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleValidation}
          disabled={isValidating || !licensePlate.trim()}
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Refresh className="mr-2 h-4 w-4" />
              Validate
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
