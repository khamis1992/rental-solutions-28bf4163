
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ExternalLink, Upload } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import AgreementFormWithVehicleCheck from "@/components/agreements/AgreementFormWithVehicleCheck";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkStandardTemplateExists, diagnosisTemplateAccess } from "@/utils/agreementUtils";
import { ensureStorageBuckets } from "@/utils/setupBuckets";
import { diagnoseTemplateUrl, uploadAgreementTemplate, checkSpecificTemplateUrl, fixTemplateUrl } from "@/utils/templateUtils";
import { checkVehicleAvailability, activateAgreement } from "@/utils/agreement-utils";
import { forceGeneratePaymentForAgreement } from "@/lib/validation-schemas/agreement";

const AddAgreement = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [checkingTemplate, setCheckingTemplate] = useState<boolean>(true);
  const [templateDiagnosis, setTemplateDiagnosis] = useState<any>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateUrlDiagnosis, setTemplateUrlDiagnosis] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const { customer_data, vehicle_data, terms_accepted, ...leaseData } = formData;
      if (!leaseData.vehicle_id || leaseData.vehicle_id.trim() === "") {
        toast.error("Vehicle is required to create an agreement.");
        setIsSubmitting(false);
        return;
      }
      
      if (leaseData.vehicle_id && leaseData.status === 'active') {
        const { isAvailable, existingAgreement } = await checkVehicleAvailability(leaseData.vehicle_id);
        
        if (!isAvailable && existingAgreement) {
          console.log(`Vehicle is assigned to agreement #${existingAgreement.agreement_number} which will be closed`);
        }
      }
      
      console.log("Submitting lease data:", leaseData);
      
      const { data, error } = await supabase.from("leases").insert([leaseData]).select("id").single();
      if (error) {
        throw error;
      }
      
      if (leaseData.status === 'active' && leaseData.vehicle_id) {
        await activateAgreement(data.id, leaseData.vehicle_id);
      } else if (leaseData.status === 'active') {
        // If agreement is active but not tied to a vehicle, still generate payment
        try {
          console.log("Generating initial payment schedule for new agreement");
          const result = await forceGeneratePaymentForAgreement(supabase, data.id);
          if (!result.success) {
            console.warn("Could not generate payment schedule:", result.message);
          }
        } catch (paymentError) {
          console.error("Error generating payment schedule:", paymentError);
        }
      }
      
      toast.success("Agreement created successfully");
      navigate(`/agreements/${data.id}`);
    } catch (error: any) {
      console.error("Error creating agreement:", error);
      toast.error("Failed to create agreement", {
        description: error.message || "Something went wrong"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadAgreementTemplate(file);
      if (result.success) {
        toast.success("Template Uploaded", {
          description: "The agreement template has been successfully uploaded."
        });

        setStandardTemplateExists(true);
        setTemplateError(null);

        const urlDiagnosis = await diagnoseTemplateUrl();
        setTemplateUrlDiagnosis(urlDiagnosis);
        
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('template_check_result', JSON.stringify({
            exists: true,
            timestamp: Date.now(),
            urlDiagnosis
          }));
        }
      } else {
        setUploadError(result.error || "Unknown error uploading template");
        toast.error("Upload Failed", {
          description: result.error || "Failed to upload template."
        });
      }
    } catch (error: any) {
      setUploadError(error.message || "Error uploading template");
      toast.error("Upload Error", {
        description: error.message || "An unexpected error occurred."
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <PageContainer 
      title="Create New Agreement" 
      description="Create a new rental agreement with a customer" 
      backLink="/agreements"
    >
      {specificUrlCheck && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Template Check</AlertTitle>
          <AlertDescription>
            {specificUrlCheck.accessible ? (
              <span className="text-green-600">Template is accessible</span>
            ) : (
              <span className="text-amber-600">Template is not accessible: {specificUrlCheck.error}</span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {templateError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Template Issue</AlertTitle>
          <AlertDescription>
            {templateError}
            {templateDiagnosis && (
              <div className="mt-2 text-xs">
                <p>
                  Diagnosis: Storage bucket {templateDiagnosis.bucketExists ? 'exists' : 'missing'}, 
                  Template {templateDiagnosis.templateExists ? 'exists' : 'missing'}
                </p>
              </div>
            )}
            
            <div className="mt-3">
              <label htmlFor="template-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Upload Template File
                </div>
                <input 
                  id="template-upload" 
                  type="file" 
                  accept=".docx" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={isUploading} 
                />
              </label>
              {isUploading && <p className="text-xs mt-1">Uploading...</p>}
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>
            
            <div className="mt-3 text-xs">
              <strong>Manual Fix:</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Go to the Supabase dashboard</li>
                <li>Navigate to Storage</li>
                <li>Create a bucket named "agreements" with public read access</li>
                <li>Upload a file named "agreement_template.docx"</li>
                <li>Set the file permissions to public</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {templateUrlDiagnosis && templateUrlDiagnosis.status !== "success" && 
        specificUrlCheck && !specificUrlCheck.accessible && (
        <Alert variant="destructive" className="mb-4 border-amber-500 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Template URL Issues</AlertTitle>
          <AlertDescription>
            <div className="mt-1">
              <ul className="list-disc pl-5 text-sm">
                {templateUrlDiagnosis.issues.map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
              
              {templateUrlDiagnosis.suggestions.length > 0 && (
                <>
                  <p className="font-semibold mt-2">Suggestions:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {templateUrlDiagnosis.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </>
              )}
              
              {templateUrlDiagnosis.url && (
                <div className="mt-2">
                  <p className="text-sm">Current template URL:</p>
                  <a 
                    href={templateUrlDiagnosis.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    {templateUrlDiagnosis.url.substring(0, 50)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {((standardTemplateExists || (specificUrlCheck && specificUrlCheck.accessible)) && !templateError) && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Template Ready</AlertTitle>
          <AlertDescription>
            Agreement template is available and ready to use.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Agreement Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementFormWithVehicleCheck 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
            standardTemplateExists={standardTemplateExists || (specificUrlCheck && specificUrlCheck.accessible) || false} 
            isCheckingTemplate={checkingTemplate} 
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AddAgreement;
