
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface TemplateStatus {
  exists: boolean;
  message: string;
}

export const createTemplateStatus = (exists: boolean, message: string): TemplateStatus => {
  return { exists, message };
};

interface AgreementTemplateStatusProps {
  standardTemplateExists: TemplateStatus;
  specificUrlCheck: TemplateStatus;
}

export const AgreementTemplateStatus: React.FC<AgreementTemplateStatusProps> = ({
  standardTemplateExists,
  specificUrlCheck,
}) => {
  if (specificUrlCheck.exists) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          {specificUrlCheck.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (standardTemplateExists.exists) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          {standardTemplateExists.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-700">
        No agreement templates found. Content will need to be entered manually.
      </AlertDescription>
    </Alert>
  );
};
