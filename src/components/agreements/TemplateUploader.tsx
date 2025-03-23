
import { useState } from "react";
import { 
  UploadCloud, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle,
  RefreshCcw,
  Bug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ensureStorageBuckets, diagnoseStorageIssues } from "@/utils/setupBuckets";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TemplateUploaderProps {
  onUploadComplete: (url: string) => void;
  currentTemplate: string | null;
}

export const TemplateUploader = ({ 
  onUploadComplete, 
  currentTemplate 
}: TemplateUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [retryingBucket, setRetryingBucket] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const allowedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (!allowedFileTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Please upload a PDF, Word document, or text file.");
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setErrorDetails(null);
      
      if (selectedFile.type === "application/pdf") {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      } else {
        setPreview(null);
      }
    }
  };

  const retryBucketSetup = async () => {
    setRetryingBucket(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      const result = await ensureStorageBuckets();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to set up storage bucket");
      }
      
      setError(null);
    } catch (err: any) {
      setError(`Storage bucket setup failed: ${err.message || "Unknown error"}`);
    } finally {
      setRetryingBucket(false);
    }
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

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw new Error(`Failed to check storage buckets: ${bucketsError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
      
      if (!bucketExists) {
        console.log('Bucket does not exist, attempting to create it first...');
        const result = await ensureStorageBuckets();
        
        if (!result.success) {
          throw new Error(result.error || 'Storage bucket "agreements" could not be created');
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `template_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `agreement_templates/${fileName}`;
      
      console.log(`Attempting to upload file to path: ${filePath}`);
      const { error: uploadError, data } = await supabase.storage
        .from('agreements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful, getting public URL');
      const { data: { publicUrl } } = supabase.storage
        .from('agreements')
        .getPublicUrl(filePath);
      
      console.log('Public URL generated:', publicUrl);
      onUploadComplete(publicUrl);
      
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      
      setFile(null);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      
      // Run diagnostics automatically on failure
      const diagnostics = await diagnoseStorageIssues();
      setDiagnosticInfo(diagnostics);
      setErrorDetails(err);
      
      if (err.message && err.message.includes("bucket")) {
        setError(`Storage bucket error: ${err.message}. You can try to refresh the page or use the retry button.`);
      } else if (err.message && err.message.includes("permission")) {
        setError(`Permission denied: ${err.message}. The storage bucket may not be properly configured.`);
      } else if (err.statusCode === 400) {
        setError(`Bad request: ${err.message}. There might be an issue with the file or the bucket configuration.`);
      } else if (err.statusCode === 404) {
        setError(`Not found: The storage bucket "agreements" could not be found or accessed.`);
      } else if (err.statusCode === 403) {
        setError(`Forbidden: You don't have permission to upload to this bucket.`);
      } else {
        setError(err.message || "Failed to upload template");
      }
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col">
            <span>{error}</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {error.includes("bucket") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryBucketSetup}
                  disabled={retryingBucket}
                >
                  {retryingBucket ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                      Trying to fix...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Retry Bucket Setup
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
              >
                {isRunningDiagnostics ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
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
            
            {(diagnosticInfo || errorDetails) && (
              <Accordion type="single" collapsible className="w-full mt-2 bg-red-50 rounded p-2">
                <AccordionItem value="diagnostics">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center">
                      <Bug className="h-4 w-4 mr-2" />
                      View Diagnostic Information
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-xs font-mono whitespace-pre-wrap bg-black text-green-400 p-2 rounded overflow-auto max-h-60">
                      <div className="mb-2">
                        <strong>Diagnostics:</strong>
                        {JSON.stringify(diagnosticInfo, null, 2)}
                      </div>
                      {errorDetails && (
                        <div>
                          <strong>Error Details:</strong>
                          {JSON.stringify(errorDetails, null, 2)}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {currentTemplate && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Template Ready</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Agreement template has been uploaded.</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(currentTemplate, '_blank')}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Template
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          {file ? (
            <Card className="w-full p-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={clearSelectedFile}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="flex-1 truncate">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              
              {preview && file.type === "application/pdf" && (
                <div className="mt-4 h-[200px] border rounded overflow-hidden">
                  <iframe 
                    src={preview} 
                    className="w-full h-full" 
                    title="PDF Preview" 
                  />
                </div>
              )}
              
              <Button
                className="w-full mt-4"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload Template
                  </>
                )}
              </Button>
            </Card>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Upload Agreement Template</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your template file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Supports PDF, Word documents, and text files (Max 5MB)
              </p>
              <Button asChild variant="secondary">
                <label>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                  />
                  Browse Files
                </label>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium mb-2">Template Guidelines</h4>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Use placeholders like {"{{CUSTOMER_NAME}}"}, {"{{VEHICLE_MODEL}}"}, etc.</li>
          <li>The system will automatically replace placeholders with agreement data</li>
          <li>Include sections for Terms & Conditions, Signatures, and Payment Schedule</li>
          <li>Add your company logo and branding to the template</li>
        </ul>
      </div>
    </div>
  );
};
