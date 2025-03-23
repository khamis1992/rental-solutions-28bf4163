
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import AgreementForm from "@/components/agreements/AgreementForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { TemplateUploader } from "@/components/agreements/TemplateUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureStorageBuckets, diagnoseStorageIssues } from "@/utils/setupBuckets";
import { Loader2, RefreshCcw, AlertCircle, Bug, Terminal } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AddAgreement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [isBucketReady, setIsBucketReady] = useState(false);
  const [isSettingUpBucket, setIsSettingUpBucket] = useState(true);
  const [setupAttempts, setSetupAttempts] = useState(0);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  // Check and create buckets if needed on component mount
  useEffect(() => {
    const setupBuckets = async () => {
      setIsSettingUpBucket(true);
      setSetupError(null);
      
      try {
        console.log(`Attempting to setup storage buckets (attempt ${setupAttempts + 1})...`);
        const result = await ensureStorageBuckets();
        setIsBucketReady(result.success);
        
        if (result.success) {
          console.log("Storage buckets set up successfully");
          toast({
            title: "Storage setup complete",
            description: "Template uploads are now available.",
          });
          
          if (result.error) {
            console.warn("Storage setup succeeded with warnings:", result.error);
          }
        } else {
          const errorMsg = `Storage setup failed: ${result.error || "Unknown error"}`;
          console.error(errorMsg, result.details);
          setSetupError(errorMsg);
          toast({
            title: "Storage setup issue",
            description: errorMsg,
            variant: "destructive"
          });
          
          // Run diagnostics automatically on failure
          runDiagnostics();
        }
      } catch (error: any) {
        const errorMsg = `Error setting up storage: ${error.message || "Unknown error"}`;
        console.error(errorMsg, error);
        setSetupError(errorMsg);
        toast({
          title: "Storage setup error",
          description: errorMsg,
          variant: "destructive"
        });
      } finally {
        setIsSettingUpBucket(false);
      }
    };
    
    setupBuckets();
  }, [toast, setupAttempts]);

  const retryBucketSetup = () => {
    setDiagnosticInfo(null);
    setSetupAttempts(prev => prev + 1);
  };
  
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const diagnostics = await diagnoseStorageIssues();
      setDiagnosticInfo(diagnostics);
      console.log("Storage diagnostics:", diagnostics);
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleTemplateUpload = (url: string) => {
    setTemplateUrl(url);
    toast({
      title: "Template uploaded",
      description: "The agreement template has been successfully uploaded.",
    });
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Add the template URL to the agreement data if one was uploaded
      const agreementData = {
        ...formData,
        template_url: templateUrl,
      };

      // Create the agreement in the database
      const { data, error } = await supabase
        .from("leases")
        .insert([agreementData])
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Agreement created",
        description: "The agreement has been successfully created.",
      });

      // Navigate to the agreement detail page
      navigate(`/agreements/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating agreement",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Create New Agreement" 
      description="Create a new rental agreement with a customer"
      backLink="/agreements"
    >
      {setupError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Setup Error</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <span>{setupError}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retryBucketSetup}
                disabled={isSettingUpBucket}
              >
                {isSettingUpBucket ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Trying to fix...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry Storage Setup
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
              >
                {isRunningDiagnostics ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running diagnostics...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-4 w-4" />
                    Diagnose Issues
                  </>
                )}
              </Button>
            </div>
            
            {diagnosticInfo && (
              <Accordion type="single" collapsible className="w-full mt-2 bg-red-50 rounded p-2">
                <AccordionItem value="diagnostics">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center">
                      <Terminal className="h-4 w-4 mr-2" />
                      View Diagnostic Information
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-xs font-mono whitespace-pre-wrap bg-black text-green-400 p-2 rounded overflow-auto max-h-60">
                      {JSON.stringify(diagnosticInfo, null, 2)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="form">
        <TabsList className="mb-4">
          <TabsTrigger value="form">Agreement Form</TabsTrigger>
          <TabsTrigger value="template">Agreement Template</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Information</CardTitle>
            </CardHeader>
            <CardContent>
              <AgreementForm onSubmit={handleSubmit} isSubmitting={isSubmitting} templateUrl={templateUrl} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Upload Agreement Template</CardTitle>
            </CardHeader>
            <CardContent>
              {isSettingUpBucket ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 mb-4 rounded-md flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up storage... Please wait while we prepare the template upload functionality.
                </div>
              ) : !isBucketReady ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-4 rounded-md">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Storage setup failed. Template uploads will not work.
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={retryBucketSetup}
                        disabled={isSettingUpBucket}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Retry Storage Setup
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={runDiagnostics}
                        disabled={isRunningDiagnostics}
                      >
                        {isRunningDiagnostics ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running diagnostics...
                          </>
                        ) : (
                          <>
                            <Bug className="mr-2 h-4 w-4" />
                            Diagnose Issues
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {diagnosticInfo && (
                      <Accordion type="single" collapsible className="w-full mt-2 bg-red-50 rounded border border-red-200 p-2">
                        <AccordionItem value="diagnostics">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center">
                              <Terminal className="h-4 w-4 mr-2" />
                              View Diagnostic Information
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-xs font-mono whitespace-pre-wrap bg-black text-green-400 p-2 rounded overflow-auto max-h-60">
                              {JSON.stringify(diagnosticInfo, null, 2)}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    
                    <p className="text-sm mt-2">
                      You can continue creating the agreement without a template, or try again later.
                    </p>
                  </div>
                </div>
              ) : (
                <TemplateUploader 
                  onUploadComplete={handleTemplateUpload} 
                  currentTemplate={templateUrl} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default AddAgreement;
