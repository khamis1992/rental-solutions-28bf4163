
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CustomButton } from '@/components/ui/custom-button';

interface StorageConfigAlertProps {
  bucketStatus: string;
  errorMessage?: string | null;
  onRetry: () => Promise<void>;
}

const StorageConfigAlert: React.FC<StorageConfigAlertProps> = ({
  bucketStatus,
  errorMessage,
  onRetry
}) => {
  return (
    <Alert variant="destructive" className="mb-4 text-left">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Storage Configuration Error</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {bucketStatus === 'permissions-error' 
            ? 'Cannot access storage bucket due to permission issues.'
            : errorMessage || 'Unable to configure image storage. Contact an administrator.'}
        </p>
        <p className="text-xs mb-2">
          Check that your Supabase service role key is properly configured in .env file.
        </p>
        <div className="flex gap-2 mt-3">
          <CustomButton
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            Retry
          </CustomButton>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default StorageConfigAlert;
