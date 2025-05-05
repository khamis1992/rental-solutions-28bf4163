
import React from 'react';

interface AgreementFormStatusProps {
  updateProgress: string | null;
  validationErrors: Record<string, string> | null;
}

export const AgreementFormStatus: React.FC<AgreementFormStatusProps> = ({
  updateProgress,
  validationErrors
}) => {
  return (
    <>
      {updateProgress && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
          <p className="flex items-center">
            <span className="animate-pulse mr-2">⏳</span>
            <span>{updateProgress}</span>
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
