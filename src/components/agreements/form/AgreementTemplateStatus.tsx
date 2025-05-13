
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Define proper TemplateStatus type 
export interface TemplateStatus {
  accessible: boolean;
  message: string;
}

// Helper function to create template status object
export function createTemplateStatus(accessible: boolean, message: string): TemplateStatus {
  return { accessible, message };
}

interface AgreementTemplateStatusProps {
  standardTemplateExists: TemplateStatus;
  specificUrlCheck: TemplateStatus;
}

export function AgreementTemplateStatus({ 
  standardTemplateExists, 
  specificUrlCheck 
}: AgreementTemplateStatusProps) {
  // Don't show anything if both templates are available
  if (standardTemplateExists.accessible && specificUrlCheck.accessible) {
    return null;
  }
  
  return (
    <Alert className={standardTemplateExists.accessible ? "bg-green-50" : "bg-amber-50"}>
      <AlertTitle>
        {standardTemplateExists.accessible 
          ? "Template Available" 
          : "Template Information"}
      </AlertTitle>
      <AlertDescription>
        {specificUrlCheck.accessible 
          ? "Using custom template specified in URL"
          : standardTemplateExists.accessible 
              ? "Using standard agreement template" 
              : "No standard agreement template found. Agreement will be created without a template."}
      </AlertDescription>
    </Alert>
  );
}
