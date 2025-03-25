
import React from 'react';
import { Image, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';

interface UploadPlaceholderProps {
  bucketStatus: string;
  errorMessage: string | null;
  isChecking: boolean;
  onClick: () => void;
}

const UploadPlaceholder: React.FC<UploadPlaceholderProps> = ({
  bucketStatus,
  errorMessage,
  isChecking,
  onClick
}) => {
  const isReady = bucketStatus === 'ready';
  const isError = errorMessage && !['error', 'permissions-error'].includes(bucketStatus);

  return (
    <>
      <Image className="h-12 w-12 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-2">
        Drag & drop an image here, or click to select
      </p>
      <CustomButton 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={onClick}
        disabled={!isReady}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </CustomButton>
      <p className="text-xs text-muted-foreground mt-3">
        JPG, PNG or WEBP (max. 5MB)
      </p>
      
      {bucketStatus === 'checking' && (
        <p className="text-xs text-muted-foreground mt-2">
          Checking storage configuration...
        </p>
      )}
      
      {isError && (
        <div className="mt-3 flex items-center text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default UploadPlaceholder;
