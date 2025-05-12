
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface TemplateStatus {
  accessible: boolean;
  message: string;
}

// Helper function to convert boolean to TemplateStatus
export function createTemplateStatus(accessible: boolean, message: string): TemplateStatus {
  return {
    accessible, 
    message
  };
}

interface AgreementTemplateStatusProps {
  standardTemplateExists: TemplateStatus;
  specificUrlCheck: TemplateStatus;
}

export const AgreementTemplateStatus: React.FC<AgreementTemplateStatusProps> = ({
  standardTemplateExists,
  specificUrlCheck
}) => {
  if (!standardTemplateExists.accessible && !specificUrlCheck.accessible) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Template Not Found</AlertTitle>
        <AlertDescription>
          No agreement template is available. Some features might be limited.
        </AlertDescription>
      </Alert>
    );
  }

  if (specificUrlCheck.accessible) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Special Template Available</AlertTitle>
        <AlertDescription>
          A URL-specific template will be used for this agreement.
        </AlertDescription>
      </Alert>
    );
  }

  if (standardTemplateExists.accessible) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle>Standard Template Available</AlertTitle>
        <AlertDescription>
          The standard agreement template will be used.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
