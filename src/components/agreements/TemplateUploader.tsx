import { useState } from "react";
import { 
  UploadCloud, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ensureStorageBuckets } from "@/utils/setupBuckets";

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
  const [preview, setPreview] = useState<string | null>(null);
  const [retryingBucket, setRetryingBucket] = useState(false);

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
    
    try {
      const success = await ensureStorageBuckets();
      
      if (!success) {
        throw new Error("Failed to set up storage bucket. Please try again later.");
      }
      
      setError(null);
    } catch (err: any) {
      setError(`Storage bucket setup failed: ${err.message || "Unknown error"}`);
    } finally {
      setRetryingBucket(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw new Error(`Failed to check storage buckets: ${bucketsError.message}`);
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'agreements');
      
      if (!bucketExists) {
        const bucketCreated = await ensureStorageBuckets();
        
        if (!bucketCreated) {
          throw new Error('Storage bucket "agreements" not available. Please try again later.');
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `template_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `agreement_templates/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('agreements')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('agreements')
        .getPublicUrl(filePath);
      
      onUploadComplete(publicUrl);
      
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      
      setFile(null);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      
      if (err.message && err.message.includes("bucket")) {
        setError(`Storage bucket error: ${err.message}. You can try to refresh the page or use the retry button.`);
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
            {error.includes("bucket") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 self-start"
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
