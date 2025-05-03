
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Loader2, SearchIcon, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useBatchValidation } from '@/hooks/traffic-fines';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BatchValidationFormProps {
  batchInput: string;
  setBatchInput: (value: string) => void;
  validating: boolean;
  onValidate: () => void;
  onHideBatchInput: () => void;
}

const BatchValidationForm = ({
  batchInput,
  setBatchInput,
  validating,
  onValidate,
  onHideBatchInput
}: BatchValidationFormProps) => {
  const [concurrency, setConcurrency] = useState(2);
  const [continueOnError, setContinueOnError] = useState(true);
  
  const { validateBatch, isValidating, validationProgress } = useBatchValidation();
  
  const handleValidate = async () => {
    if (!batchInput.trim()) return;
    
    // Parse license plates from textarea (one per line)
    const licensePlates = batchInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
      
    if (licensePlates.length === 0) return;
    
    try {
      // Perform batch validation with progress tracking
      await validateBatch(licensePlates, {
        batchSize: 5, 
        concurrency,
        continueOnError
      });
      
      // Call the parent component's validation handler
      onValidate();
    } catch (error) {
      console.error('Batch validation error:', error);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="batchInput">Batch License Plates</Label>
        <Button
          variant="ghost" 
          size="sm"
          onClick={onHideBatchInput}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <textarea
        id="batchInput"
        placeholder="Enter each license plate on a new line"
        value={batchInput}
        onChange={(e) => setBatchInput(e.target.value)}
        className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={validating || isValidating}
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>Enter up to 20 license plates, one per line</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Label htmlFor="concurrency" className="text-xs">Concurrency:</Label>
            <select 
              id="concurrency"
              className="text-xs bg-background border rounded px-1"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={validating || isValidating}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <input 
              type="checkbox" 
              id="continueOnError"
              checked={continueOnError}
              onChange={(e) => setContinueOnError(e.target.checked)}
              disabled={validating || isValidating}
            />
            <Label htmlFor="continueOnError" className="text-xs">Continue on errors</Label>
          </div>
        </div>
      </div>
      
      {validationProgress && (
        <div className="space-y-1">
          <Progress value={validationProgress.percentComplete} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processing batch...</span>
            <span>{validationProgress.processed} / {validationProgress.total}</span>
          </div>
        </div>
      )}
      
      <Button 
        onClick={handleValidate} 
        disabled={validating || isValidating || !batchInput.trim()}
        className="w-full"
      >
        {validating || isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating Batch...
          </>
        ) : (
          <>
            <SearchIcon className="mr-2 h-4 w-4" />
            Validate All Plates
          </>
        )}
      </Button>
      
      {(!validating && !isValidating && batchInput.split('\n').filter(Boolean).length > 10) && (
        <Alert variant="warning" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Processing large batches may take some time. Consider reducing the batch size for faster results.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BatchValidationForm;
