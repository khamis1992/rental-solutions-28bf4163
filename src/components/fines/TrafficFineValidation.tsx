
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, CheckCircle, Search, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useTrafficFinesValidation } from "@/hooks/use-traffic-fines-validation";

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [validationResults, setValidationResults] = useState<any>(null);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { trafficFines, assignToCustomer, payTrafficFine } = useTrafficFines();
  const { validateTrafficFine, validationHistory: history, isLoading: isHistoryLoading } = useTrafficFinesValidation();

  const handleValidation = async () => {
    if (!licensePlate.trim()) {
      toast.error("Please enter a license plate number");
      return;
    }

    try {
      setIsValidating(true);
      setError(null);
      
      const result = await validateTrafficFine(licensePlate);
      
      setValidationResults(result);
      toast.success(`Validation complete for license plate ${licensePlate}`);
      
      // Update fines status based on validation results
      if (trafficFines) {
        const matchingFines = trafficFines.filter(
          fine => fine.licensePlate === licensePlate && fine.paymentStatus === 'pending'
        );
        
        if (matchingFines.length > 0) {
          if (!result?.hasFine) {
            // If no fine found in the validation system, mark as paid
            matchingFines.forEach(async (fine) => {
              await payTrafficFine.mutate({ id: fine.id });
            });
            toast.success(`${matchingFines.length} fine(s) marked as paid based on validation results`);
          }
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during validation");
      toast.error("Failed to validate traffic fine");
    } finally {
      setIsValidating(false);
    }
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setLicensePlate(value.toUpperCase());
  }, 300);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Validation</CardTitle>
          <CardDescription>
            Check for traffic fines in the Government Traffic System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="licensePlate">License Plate Number</Label>
            <div className="flex gap-2">
              <Input 
                id="licensePlate"
                placeholder="Enter license plate number" 
                onChange={(e) => debouncedSearch(e.target.value)}
                className="uppercase"
              />
              <Button 
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
                    <FileSearch className="mr-2 h-4 w-4" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {validationResults && (
            <div className="p-4 bg-muted rounded-md space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Validation Results</h3>
                <Badge className={validationResults.hasFine ? "bg-red-500" : "bg-green-500"}>
                  {validationResults.hasFine ? (
                    <><AlertTriangle className="mr-1 h-3 w-3" /> Fine Found</>
                  ) : (
                    <><CheckCircle className="mr-1 h-3 w-3" /> No Fines</>
                  )}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium">License Plate</p>
                  <p className="text-sm">{validationResults.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Validation Date</p>
                  <p className="text-sm">{new Date(validationResults.validationDate).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Validation Source</p>
                <p className="text-sm">{validationResults.validationSource}</p>
              </div>
              
              {validationResults.hasFine && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Traffic Fine Found</AlertTitle>
                  <AlertDescription>
                    This vehicle has pending traffic fines in the system.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Validations</CardTitle>
          <CardDescription>
            History of recent traffic fine validations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">License Plate</th>
                    <th className="text-left p-3">Result</th>
                    <th className="text-left p-3">Validation Source</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.licensePlate}</td>
                      <td className="p-3">
                        <Badge className={item.hasFine ? "bg-red-500" : "bg-green-500"}>
                          {item.hasFine ? "Fine Found" : "No Fines"}
                        </Badge>
                      </td>
                      <td className="p-3">{item.validationSource}</td>
                      <td className="p-3">{new Date(item.validationDate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No validation history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineValidation;
