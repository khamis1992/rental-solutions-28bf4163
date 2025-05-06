
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";

interface TemplateSetupResult {
  standardTemplateExists: boolean;
  templateError: string | null;
  checkingTemplate: boolean;
  templateDiagnosis: any;
  templateUrlDiagnosis: any;
  specificUrlCheck: any;
}

export const useTemplateSetup = (): TemplateSetupResult => {
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);
  const [templateDiagnosis, setTemplateDiagnosis] = useState<any>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateUrlDiagnosis, setTemplateUrlDiagnosis] = useState<any>(null);
  const [specificUrlCheck, setSpecificUrlCheck] = useState<any>(null);

  useEffect(() => {
    const checkTemplateExists = async () => {
      try {
        // Check if agreement templates exist
        setCheckingTemplate(true);
        
        const { data, error } = await supabase
          .from('agreement_templates')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error("Error checking templates:", error);
          setTemplateError("Error checking templates: " + error.message);
          setStandardTemplateExists(false);
          return;
        }
        
        const exists = Array.isArray(data) && data.length > 0;
        console.log("Template check result:", exists ? "Templates found" : "No templates found");
        setStandardTemplateExists(exists);
        
        // For demo purposes, simulate a specific URL check
        setSpecificUrlCheck({ 
          accessible: true, 
          message: "Template is accessible and ready to use"
        });
        
        setTemplateError(null);
      } catch (error: any) {
        console.error("Error in template setup:", error);
        setTemplateError("Error in template setup: " + (error.message || "Unknown error"));
        setStandardTemplateExists(false);
      } finally {
        setCheckingTemplate(false);
      }
    };
    
    checkTemplateExists();
  }, []);

  return {
    standardTemplateExists,
    templateError,
    checkingTemplate,
    templateDiagnosis,
    templateUrlDiagnosis,
    specificUrlCheck
  };
};
