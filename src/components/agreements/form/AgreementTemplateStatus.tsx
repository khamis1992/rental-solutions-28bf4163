
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface AgreementTemplateStatusProps {
  standardTemplateExists: boolean;
  specificUrlCheck: { accessible: boolean; message: string } | null;
  checkingTemplate?: boolean;
}

export const AgreementTemplateStatus: React.FC<AgreementTemplateStatusProps> = ({
  standardTemplateExists,
  specificUrlCheck,
  checkingTemplate = false
}) => {
  if (checkingTemplate) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <AlertTitle>Checking template availability</AlertTitle>
        <AlertDescription>
          Verifying if agreement templates are available...
        </AlertDescription>
      </Alert>
    );
  }

  if (standardTemplateExists) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>Template Ready</AlertTitle>
        <AlertDescription>
          {specificUrlCheck?.message || "Agreement template is available for use."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Template Missing</AlertTitle>
      <AlertDescription>
        No agreement template found. You can still create an agreement, but you'll need to create a template later for document generation.
      </AlertDescription>
    </Alert>
  );
};
