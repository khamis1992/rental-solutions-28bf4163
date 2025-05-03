
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HelpCircle, Loader2, ListChecks, FileText, SearchIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SingleValidationForm from "@/components/fines/validation/SingleValidationForm";
import BatchValidationForm from "@/components/fines/validation/BatchValidationForm";
import ValidationHistory from "@/components/fines/validation/ValidationHistory";
import ValidationResult from "@/components/fines/validation/ValidationResult";
import { useTrafficFinesValidation } from "@/hooks/use-traffic-fines-validation";
import { useBatchValidation } from "@/hooks/traffic-fines/use-batch-validation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValidationResultType {
  licensePlate: string;
  isValid: boolean;
  message: string;
  details?: any;
  timestamp?: Date;
  validationDate?: Date;
  validationSource?: string;
  hasFine?: boolean;
}

const TrafficFineValidation = () => {
  const [licensePlate, setLicensePlate] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResultType | null>(null);
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("single");

  const {
    validateTrafficFine,
    validationHistory,
    isLoading,
    error,
    validationErrors,
    clearValidationErrors
  } = useTrafficFinesValidation();

  const { validateBatch, isValidating } = useBatchValidation();

  // Clear validation result when switching tabs
  useEffect(() => {
    setValidationResult(null);
    setLicensePlate("");
    setBatchInput("");
  }, [activeTab]);

  const handleValidate = async () => {
    if (!licensePlate.trim()) {
      toast.error("Please enter a license plate");
      return;
    }

    try {
      const result = await validateTrafficFine(licensePlate.trim());
      setValidationResult({
        licensePlate: licensePlate.trim(),
        ...result
      });
    } catch (error) {
      console.error("Validation error:", error);
      // Error will be handled by the hook's error handling
    }
  };

  const handleBatchValidate = async () => {
    if (!batchInput.trim()) {
      toast.error("Please enter at least one license plate");
      return;
    }

    const plates = batchInput
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    if (plates.length === 0) {
      toast.error("No valid license plates found");
      return;
    }

    // Create validation result objects with required properties
    const validationResults = plates.map(plate => ({
      licensePlate: plate,
      isValid: true,
      message: 'Validation pending',
      validationDate: new Date(),
      validationSource: 'batch',
      hasFine: false
    }));

    try {
      await validateBatch(plates);
      // Refresh history after batch validation
      setShowBatchInput(false);
      setActiveTab("history");
    } catch (error) {
      console.error("Batch validation error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Traffic Fine Validation</CardTitle>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearValidationErrors()}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Validate license plates against traffic violations database to check for any outstanding fines.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="single" className="flex items-center">
              <SearchIcon className="h-4 w-4 mr-2" />
              Single Query
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center">
              <ListChecks className="h-4 w-4 mr-2" />
              Batch Process
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <SingleValidationForm
              licensePlate={licensePlate}
              setLicensePlate={setLicensePlate}
              validating={isLoading}
              onValidate={handleValidate}
              onShowBatchInput={() => setShowBatchInput(true)}
            />

            {validationResult && (
              <ValidationResult
                result={validationResult}
                licensePlate={validationResult.licensePlate}
              />
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <BatchValidationForm
              batchInput={batchInput}
              setBatchInput={setBatchInput}
              validating={isLoading}
              onValidate={handleBatchValidate}
              onHideBatchInput={() => setShowBatchInput(false)}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ValidationHistory
              history={validationHistory || []}
            />
          </TabsContent>
        </Tabs>

        {validationErrors && validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 text-sm">
                {validationErrors.slice(0, 3).map((err, idx) => (
                  <li key={idx}>{err.message}</li>
                ))}
                {validationErrors.length > 3 && (
                  <li>Plus {validationErrors.length - 3} more errors...</li>
                )}
              </ul>
              <Button
                size="sm"
                variant="outline"
                onClick={() => clearValidationErrors()}
                className="mt-2"
              >
                Clear Errors
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficFineValidation;
