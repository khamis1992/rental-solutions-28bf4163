
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export interface SingleValidationFormProps {
  licensePlate: string;
  setLicensePlate: React.Dispatch<React.SetStateAction<string>>;
  validating: boolean;
  onValidate: () => void;
  onShowBatchInput?: () => void;
}

const SingleValidationForm: React.FC<SingleValidationFormProps> = ({
  licensePlate,
  setLicensePlate,
  validating,
  onValidate,
  onShowBatchInput
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Enter license plate number..."
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          className="flex-1"
          disabled={validating}
          onKeyDown={(e) => e.key === 'Enter' && onValidate()}
        />
        <Button 
          onClick={onValidate} 
          disabled={validating || !licensePlate.trim()}
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating
            </>
          ) : 'Validate'}
        </Button>
      </div>
      
      {onShowBatchInput && (
        <div className="flex justify-end">
          <Button 
            variant="link" 
            size="sm" 
            onClick={onShowBatchInput}
            className="text-xs"
          >
            Need to validate multiple plates? Use batch mode
          </Button>
        </div>
      )}
    </div>
  );
};

export default SingleValidationForm;
