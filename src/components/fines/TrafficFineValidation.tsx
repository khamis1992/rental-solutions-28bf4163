
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useTrafficFinesValidation, ValidationResult } from "@/hooks/use-traffic-fines-validation";
import { toast } from "sonner";

const ValidationInfoAlert = () => (
  <Alert className="mb-6">
    <Info className="h-4 w-4" />
    <AlertTitle>About Traffic Fine Validation</AlertTitle>
    <AlertDescription>
      <p>This tool validates if a vehicle has any outstanding traffic fines by checking against the Ministry of Interior traffic system.</p>
      
      <h4 className="font-semibold mt-2 mb-1">This process will:</h4>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        <li>Query the MOI traffic system with the provided license plate</li>
        <li>Determine if there are any unpaid fines for the vehicle</li>
        <li>Automatically update the status of any matching unpaid fines in our system</li>
        <li>Store the validation history for future reference</li>
      </ol>
      
      <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded mt-2 border border-yellow-200">
        <p><strong>Implementation Note:</strong></p>
        <p>The system is currently operating in development mode using simulated responses based on license plate numbers. 
        Even-sum license plates will report fines while odd-sum plates will report no fines.</p>
        <p className="mt-1">For full production implementation with the actual MOI system, additional configuration is required.</p>
      </div>
    </AlertDescription>
  </Alert>
);

const ValidationStatus = ({ result }: { result: ValidationResult | null }) => {
  if (!result) return null;
  
  return (
    <Card className={`mt-4 ${result.hasFine ? 'border-red-300' : 'border-green-300'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {result.hasFine ? (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Fine Detected</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>No Fines Found</span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          License Plate: <span className="font-medium">{result.licensePlate}</span>
          <br />
          Validation Date: {new Date(result.validationDate).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${result.hasFine ? 'text-red-600' : 'text-green-600'} font-medium`}>
          {result.details}
        </p>
      </CardContent>
    </Card>
  );
};

const ValidationHistoryItem = ({ validation }: { validation: ValidationResult }) => {
  const date = new Date(validation.validationDate).toLocaleString();
  
  return (
    <div className="flex items-center gap-2 p-2 border-b hover:bg-slate-50">
      <div className={`p-1 rounded-full ${validation.hasFine ? 'bg-red-100' : 'bg-green-100'}`}>
        {validation.hasFine ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="font-medium">{validation.licensePlate}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
        <p className="text-xs truncate">{validation.details}</p>
      </div>
    </div>
  );
};

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { validationHistory, validateTrafficFine, batchValidateTrafficFines, updateAllPendingFines } = useTrafficFinesValidation();
  
  const handleValidation = async () => {
    if (!licensePlate.trim()) {
      toast.error("Please enter a license plate number");
      return;
    }
    
    try {
      setIsValidating(true);
      const result = await validateTrafficFine(licensePlate);
      setValidationResult(result);
      toast.success("Validation completed", {
        description: result.hasFine ? "Fine detected" : "No fines found"
      });
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Validation failed", { 
        description: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleBatchUpdate = async () => {
    try {
      const result = await updateAllPendingFines.mutateAsync();
      toast.success("Batch update completed", {
        description: result.message
      });
    } catch (error) {
      console.error("Batch update error:", error);
      toast.error("Batch update failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <ValidationInfoAlert />
        
        <Card>
          <CardHeader>
            <CardTitle>Validate License Plate</CardTitle>
            <CardDescription>
              Check if a vehicle has any outstanding traffic fines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="license-plate">License Plate</Label>
              <div className="flex gap-3">
                <Input
                  id="license-plate"
                  placeholder="Enter license plate number"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleValidation} disabled={isValidating}>
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
              </div>
            </div>
            
            <ValidationStatus result={validationResult} />
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Batch Actions</h3>
              <Button 
                variant="outline" 
                onClick={handleBatchUpdate}
                disabled={updateAllPendingFines.isPending}
                className="w-full sm:w-auto"
              >
                {updateAllPendingFines.isPending ? 
                  "Processing..." : 
                  "Update All Pending Fines"
                }
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                This will check all pending fines against the MOI system and update their status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Validation History
            </CardTitle>
            <CardDescription>Recent license plate validations</CardDescription>
          </CardHeader>
          <CardContent>
            {validationHistory && validationHistory.length > 0 ? (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {validationHistory.map((validation, index) => (
                  <ValidationHistoryItem key={index} validation={validation} />
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p>No validation history available</p>
                <p className="text-sm">Validate a license plate to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrafficFineValidation;
