
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface AgreementTemplateStatusProps {
  standardTemplateExists: boolean;
  specificUrlCheck: any;
}

export const AgreementTemplateStatus: React.FC<AgreementTemplateStatusProps> = ({ 
  standardTemplateExists, 
  specificUrlCheck
}) => {
  return (
    <>
      {specificUrlCheck?.accessible && (
        <Alert className="bg-green-50 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Template Check</AlertTitle>
          <AlertDescription>
            <span className="text-green-600">Template is accessible</span>
          </AlertDescription>
        </Alert>
      )}
      
      {standardTemplateExists && (
        <Alert className="bg-green-50 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Template Ready</AlertTitle>
          <AlertDescription>
            Agreement template is available and ready to use.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
