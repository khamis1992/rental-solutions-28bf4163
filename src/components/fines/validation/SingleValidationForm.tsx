
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchIcon, Loader2 } from 'lucide-react';

interface SingleValidationFormProps {
  licensePlate: string;
  setLicensePlate: (value: string) => void;
  validating: boolean;
  onValidate: () => void;
  onShowBatchInput: () => void;
}

const SingleValidationForm = ({
  licensePlate,
  setLicensePlate,
  validating,
  onValidate,
  onShowBatchInput
}: SingleValidationFormProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="licensePlate">License Plate</Label>
      <div className="flex space-x-2">
        <Input
          id="licensePlate"
          placeholder="Enter license plate"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          className="flex-grow"
          disabled={validating}
        />
        <Button 
          onClick={onValidate} 
          disabled={validating || !licensePlate.trim()}
          className="w-36"
        >
          {validating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <SearchIcon className="mr-2 h-4 w-4" />
              Validate
            </>
          )}
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Enter the vehicle's license plate to check for any traffic fines
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShowBatchInput}
        >
          Batch Validate
        </Button>
      </div>
    </div>
  );
};

export default SingleValidationForm;
