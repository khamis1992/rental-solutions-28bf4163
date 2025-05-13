
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TemplateStatus } from './TemplateSetup';

interface AgreementTemplateStatusProps {
  standardTemplateExists: TemplateStatus;
  specificUrlCheck: TemplateStatus;
}

export function AgreementTemplateStatus({ 
  standardTemplateExists, 
  specificUrlCheck 
}: AgreementTemplateStatusProps) {
  // Don't show anything if both templates are available
  if (standardTemplateExists && specificUrlCheck) {
    return null;
  }
  
  return (
    <Alert className={standardTemplateExists ? "bg-green-50" : "bg-amber-50"}>
      <AlertTitle>
        {standardTemplateExists 
          ? "Template Available" 
          : "Template Information"}
      </AlertTitle>
      <AlertDescription>
        {specificUrlCheck 
          ? "Using custom template specified in URL"
          : standardTemplateExists 
              ? "Using standard agreement template" 
              : "No standard agreement template found. Agreement will be created without a template."}
      </AlertDescription>
    </Alert>
  );
}
