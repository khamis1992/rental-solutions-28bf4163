
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { checkStandardTemplateExists, diagnosisTemplateAccess } from "@/utils/agreementUtils";
import { ensureStorageBuckets } from "@/utils/setupBuckets";
import { diagnoseTemplateUrl, checkSpecificTemplateUrl } from "@/utils/templateUtils";

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
    if (typeof sessionStorage !== 'undefined') {
      const cachedTemplateCheck = sessionStorage.getItem('template_check_result');
      if (cachedTemplateCheck) {
        try {
          const { exists, timestamp, diagnosis, specificCheck, urlDiagnosis } = JSON.parse(cachedTemplateCheck);
          const now = Date.now();
          
          if (now - timestamp < 60 * 60 * 1000) {
            console.log('Using cached template check results');
            setStandardTemplateExists(exists);
            if (diagnosis) setTemplateDiagnosis(diagnosis);
            if (specificCheck) setSpecificUrlCheck(specificCheck);
            if (urlDiagnosis) setTemplateUrlDiagnosis(urlDiagnosis);
            setCheckingTemplate(false);
            setTemplateError(exists ? null : "Template not found. Please upload a template file or create the agreements bucket manually in Supabase dashboard.");
            return;
          }
        } catch (err) {
          console.warn('Error parsing template check cache:', err);
        }
      }
    }
    
    const setupStorage = async () => {
      try {
        console.log("Setting up storage and ensuring buckets exist...");
        setCheckingTemplate(true);
        setTemplateError(null);

        const specificUrl = "https://vqdlsidkucrownbfuouq.supabase.co/storage/v1/object/public/agreements//agreement_template.docx";
        console.log("Checking specific URL: ", specificUrl);
        const specificCheck = await checkSpecificTemplateUrl(specificUrl);
        setSpecificUrlCheck(specificCheck);
        if (specificCheck.accessible) {
          console.log("Specific URL is accessible!");
          setStandardTemplateExists(true);
          setTemplateError(null);
          setCheckingTemplate(false);
          
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('template_check_result', JSON.stringify({
              exists: true,
              timestamp: Date.now(),
              specificCheck
            }));
          }
          
          return;
        } else {
          console.log("Specific URL is not accessible:", specificCheck.error);
        }

        const result = await ensureStorageBuckets();
        if (!result.success) {
          console.error("Error setting up storage buckets:", result.error);

          if (result.error?.includes("row-level security") || result.error?.includes("RLS")) {
            setTemplateError("Permission error: Please create the 'agreements' bucket manually in the Supabase dashboard. Use the service role key for storage operations.");
          } else {
            setTemplateError(`Storage setup error: ${result.error}`);
          }
          toast.error("Storage Setup Error", {
            description: "There was an error setting up storage buckets. Template creation may fail."
          });
        } else {
          console.log("Storage buckets setup complete");
        }

        console.log("Checking if agreement template exists...");
        const exists = await checkStandardTemplateExists();
        console.log("Template exists result:", exists);
        setStandardTemplateExists(exists);
        if (!exists) {
          setTemplateError("Template not found. Please upload a template file or create the agreements bucket manually in Supabase dashboard.");
          toast.error("Template Not Found", {
            description: "The standard agreement template was not found. Please upload a template file."
          });
          const diagnosis = await diagnosisTemplateAccess();
          setTemplateDiagnosis(diagnosis);
          console.log("Template diagnosis:", diagnosis);
          if (diagnosis.errors.length > 0) {
            console.error("Diagnosis errors:", diagnosis.errors);
          }
        } else {
          setTemplateError(null);
          toast.success("Template Found", {
            description: "The agreement template was found and will be used for new agreements."
          });
        }

        const urlDiagnosis = await diagnoseTemplateUrl();
        setTemplateUrlDiagnosis(urlDiagnosis);
        console.log("Template URL diagnosis:", urlDiagnosis);
        if (urlDiagnosis.status === "error") {
          console.error("Template URL issues:", urlDiagnosis.issues);
        }
        
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('template_check_result', JSON.stringify({
            exists,
            timestamp: Date.now(),
            diagnosis: templateDiagnosis,
            specificCheck: specificUrlCheck,
            urlDiagnosis
          }));
        }
      } catch (error) {
        console.error("Error during template setup:", error);
        setStandardTemplateExists(false);
        setTemplateError("Error checking template. Please upload a template file.");
        toast.error("Error Checking Template", {
            description: "There was an error checking for the agreement template. Please upload a template file."
        });
      } finally {
        setCheckingTemplate(false);
      }
    };
    setupStorage();
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
