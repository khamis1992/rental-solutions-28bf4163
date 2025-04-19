
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  FileSearch, 
  Info, 
  RefreshCw,
  RotateCw,
  Car,
  Calendar,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useTrafficFinesValidation, ValidationResult } from "@/hooks/use-traffic-fines-validation";

const ValidationInstructions = () => (
  <Alert className="mb-4 bg-muted">
    <Info className="h-4 w-4" />
    <AlertTitle>How Validation Works</AlertTitle>
    <AlertDescription>
      <p className="text-sm text-muted-foreground">
        This feature validates license plates against the Qatar Ministry of Interior (MOI) traffic system. 
        The system will:
      </p>
      <ol className="text-sm text-muted-foreground list-decimal pl-5 mt-2 space-y-1">
        <li>Submit the license plate to check for outstanding fines</li>
        <li>Automatically update the status of any matching unpaid fines in our system</li>
        <li>Store the validation history for future reference</li>
      </ol>
    </AlertDescription>
  </Alert>
);

const ValidationResultCard = ({ result }: { result: ValidationResult }) => (
  <Card className="mt-4 border-2 overflow-hidden">
    <div className={`h-2 w-full ${result.hasFine || result.result?.has_fine ? 'bg-destructive' : 'bg-green-500'}`}></div>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg">
          {result.hasFine || result.result?.has_fine ? 'Traffic Fine Detected' : 'No Traffic Fines Found'}
        </CardTitle>
        <Badge className={result.hasFine || result.result?.has_fine ? "bg-red-500" : "bg-green-500"} variant="secondary">
          {result.hasFine || result.result?.has_fine ? (
            <><AlertTriangle className="mr-1 h-3 w-3" /> Fine Found</>
          ) : (
            <><CheckCircle className="mr-1 h-3 w-3" /> Clear</>
          )}
        </Badge>
      </div>
      <CardDescription>
        Validation performed on {new Date(result.validation_date || result.validationDate || '').toLocaleString()}
      </CardDescription>
    </CardHeader>
    <Separator />
    <CardContent className="pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">License Plate</p>
            <p className="font-medium">{result.license_plate || result.licensePlate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Source</p>
            <p className="font-medium">{result.validationSource || 'MOI Traffic System'}</p>
          </div>
        </div>
      </div>
      
      {(result.details || result.result?.details) && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground font-medium">Details</p>
          <p className="text-sm">{result.details || result.result?.details}</p>
        </div>
      )}

      {(result.hasFine || result.result?.has_fine) && (
        <Alert className="mt-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            This vehicle has pending traffic fines that require attention.
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
);

const HistoryTable = ({ history, isLoading, onRetryValidation }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div>
        <CardTitle>Recent Validations</CardTitle>
        <CardDescription>
          History of recent traffic fine validations
        </CardDescription>
      </div>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : history && history.length > 0 ? (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">License Plate</th>
                  <th className="text-left p-3">Result</th>
                  <th className="text-left p-3 hidden md:table-cell">Source</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-center p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3 font-medium">{item.licensePlate}</td>
                    <td className="p-3">
                      <Badge className={item.hasFine ? "bg-red-500" : "bg-green-500"}>
                        {item.hasFine ? "Fine Found" : "No Fines"}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">{item.validationSource}</td>
                    <td className="p-3">{new Date(item.validationDate).toLocaleDateString()}</td>
                    <td className="p-3 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRetryValidation(item.licensePlate)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No validation history available</p>
          <p className="text-sm">Validate a license plate to see results here</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { trafficFines, assignToCustomer, payTrafficFine } = useTrafficFines();
  const { validateTrafficFine, validationHistory, isLoading: isHistoryLoading } = useTrafficFinesValidation();

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

  const handleRetryValidation = async (plateNumber: string) => {
    setLicensePlate(plateNumber);
    await handleValidation();
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setLicensePlate(value.toUpperCase());
  }, 300);

  return (
    <div className="space-y-6">
      <ValidationInstructions />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSearch className="mr-2 h-5 w-5 text-primary" />
            Traffic Fine Validation
          </CardTitle>
          <CardDescription>
            Check for traffic fines in the Qatar Ministry of Interior (MOI) system
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
                defaultValue={licensePlate}
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
            <p className="text-xs text-muted-foreground mt-1">
              Enter the full license plate number (e.g., 12345)
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {validationResults && <ValidationResultCard result={validationResults} />}
        </CardContent>
      </Card>
      
      <HistoryTable 
        history={validationHistory}
        isLoading={isHistoryLoading}
        onRetryValidation={handleRetryValidation}
      />
    </div>
  );
};

export default TrafficFineValidation;
