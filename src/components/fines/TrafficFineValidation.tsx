
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTrafficFineValidation } from '@/hooks/traffic-fines/use-traffic-fine-validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidationResult } from '@/types/validation';

export function TrafficFineValidation() {
  const [licensePlate, setLicensePlate] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { validateTrafficFine, isLoading } = useTrafficFineValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licensePlate.trim()) return;
    
    try {
      const result = await validateTrafficFine(licensePlate);
      setValidationResult(result);
    } catch (error) {
      console.error("Error validating traffic fine:", error);
      setValidationResult({
        licensePlate,
        isValid: false,
        message: 'An error occurred during validation. Please try again.'
      });
    }
  };

  const handleReset = () => {
    setLicensePlate('');
    setValidationResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fine Validation</CardTitle>
        <CardDescription>
          Check if a vehicle has any outstanding traffic fines
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="licensePlate">License Plate Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="licensePlate"
                  placeholder="Enter license plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !licensePlate.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Validate
                </Button>
              </div>
            </div>

            {validationResult && (
              <div className={`mt-4 p-4 border rounded-md ${
                validationResult.isValid ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
              }`}>
                {validationResult.isValid ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Valid
                      </Badge>
                    </div>
                    <p className="text-sm text-green-800">{validationResult.message}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700">Validation Error</p>
                      <p className="text-sm text-red-600">{validationResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}

// Export the component as default
export default TrafficFineValidation;
