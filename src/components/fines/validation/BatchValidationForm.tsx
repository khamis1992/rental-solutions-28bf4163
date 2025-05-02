
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Loader2, SearchIcon } from 'lucide-react';

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
        disabled={validating}
      />
      <p className="text-xs text-muted-foreground">
        Enter up to 20 license plates, one per line
      </p>
      <Button 
        onClick={onValidate} 
        disabled={validating || !batchInput.trim()}
        className="w-full"
      >
        {validating ? (
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
    </div>
  );
};

export default BatchValidationForm;
