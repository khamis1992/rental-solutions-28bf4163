
import React from 'react';

interface AgreementFormStatusProps {
  updateProgress: number | ((progress: number) => void) | null | undefined;
  validationErrors: Record<string, string> | null | undefined;
}

export const AgreementFormStatus: React.FC<AgreementFormStatusProps> = ({
  updateProgress,
  validationErrors
}) => {
  // Determine if updateProgress is a number that should be displayed
  const showProgress = typeof updateProgress === 'number' && updateProgress > 0 && updateProgress < 100;
  
  return (
    <>
      {showProgress && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
          <p className="flex items-center">
            <span className="animate-pulse mr-2">⏳</span>
            <span>Processing... {updateProgress}%</span>
          </p>
        </div>
      )}
      
      {validationErrors && Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <p className="font-medium">Please correct the following errors:</p>
          <ul className="list-disc pl-5 mt-2 text-sm">
            {Object.entries(validationErrors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
