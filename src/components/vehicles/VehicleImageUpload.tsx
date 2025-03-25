
import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';
import { ensureVehicleImagesBucket } from '@/lib/vehicles/vehicle-storage';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VehicleImageUploadProps {
  onImageSelected: (file: File | null) => void;
  initialImageUrl?: string;
  className?: string;
}

const VehicleImageUpload: React.FC<VehicleImageUploadProps> = ({ 
  onImageSelected, 
  initialImageUrl, 
  className 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bucketReady, setBucketReady] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<string>('checking');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Ensure the vehicle-images bucket exists on component mount
    const checkBucket = async () => {
      setBucketStatus('checking');
      setIsLoading(true);
      try {
        console.log('Checking vehicle-images bucket in VehicleImageUpload...');
        const ready = await ensureVehicleImagesBucket();
        setBucketReady(ready);
        setBucketStatus(ready ? 'ready' : 'error');
        
        if (!ready) {
          console.warn('Vehicle images bucket is not ready');
          toast.error('Storage configuration issue', { 
            description: 'Unable to configure image storage. Check your Supabase configuration.' 
          });
        } else {
          console.log('Vehicle images bucket is ready');
        }
      } catch (error) {
        console.error('Error checking vehicle images bucket:', error);
        setBucketStatus('error');
        toast.error('Storage configuration error', { 
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkBucket();
    
    // Also check that we can actually list the bucket to confirm permissions
    const verifyBucketAccess = async () => {
      try {
        const { data, error } = await supabase.storage.from('vehicle-images').list();
        if (error) {
          console.warn('Could not list vehicle-images bucket:', error);
          setBucketStatus('permissions-error');
          if (error.message.includes('policy') || error.message.includes('permission')) {
            setErrorMessage('Storage permission error: Cannot access the storage bucket.');
          }
        } else {
          console.log('Successfully listed vehicle-images bucket contents:', data);
        }
      } catch (err) {
        console.error('Error verifying bucket access:', err);
      }
    };
    
    verifyBucketAccess();
  }, []);

  useEffect(() => {
    // Update preview URL if initialImageUrl changes
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleFile = (file: File | null) => {
    setErrorMessage(null);
    setIsLoading(true);
    
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file');
        toast.error('Invalid file type', { description: 'Please select an image file' });
        setIsLoading(false);
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size should be less than 5MB');
        toast.error('File too large', { description: 'File size should be less than 5MB' });
        setIsLoading(false);
        return;
      }
      
      try {
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        // Pass the file back to parent component
        onImageSelected(file);
        setIsLoading(false);
      } catch (error) {
        console.error('Error creating object URL:', error);
        setErrorMessage('Failed to process image');
        toast.error('Image processing failed', { 
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  };

  const handleRemoveImage = () => {
    if (previewUrl && !previewUrl.includes('supabase.co') && !previewUrl.includes('lovable-uploads')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setErrorMessage(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetryBucketSetup = async () => {
    setBucketStatus('checking');
    setIsLoading(true);
    try {
      const ready = await ensureVehicleImagesBucket();
      setBucketReady(ready);
      setBucketStatus(ready ? 'ready' : 'error');
      
      if (ready) {
        toast.success('Storage configured successfully');
      } else {
        toast.error('Still having issues with storage configuration');
      }
    } catch (error) {
      console.error('Error in retry bucket setup:', error);
      setBucketStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`
        relative border-2 border-dashed rounded-md p-4 text-center
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
        ${errorMessage ? 'border-red-400' : ''}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Processing image...</p>
        </div>
      ) : previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Vehicle preview" 
            className="mx-auto max-h-64 rounded-md object-contain"
            onError={(e) => {
              console.error('Failed to load image:', previewUrl);
              e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
            }}
          />
          <CustomButton
            type="button"
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove image</span>
          </CustomButton>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center">
          {(bucketStatus === 'error' || bucketStatus === 'permissions-error') ? (
            <Alert variant="destructive" className="mb-4 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Storage Configuration Error</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  {bucketStatus === 'permissions-error' 
                    ? 'Cannot access storage bucket due to permission issues.'
                    : 'Unable to configure image storage. Contact an administrator.'}
                </p>
                <p className="text-xs mb-2">
                  Check that your Supabase service role key is properly configured in .env file.
                </p>
                <div className="flex gap-2 mt-3">
                  <CustomButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRetryBucketSetup}
                  >
                    Retry
                  </CustomButton>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Image className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop an image here, or click to select
              </p>
              <CustomButton 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleButtonClick}
                disabled={bucketStatus !== 'ready'}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </CustomButton>
              <p className="text-xs text-muted-foreground mt-3">
                JPG, PNG or WEBP (max. 5MB)
              </p>
              
              {bucketStatus === 'checking' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Checking storage configuration...
                </p>
              )}
            </>
          )}
          
          {errorMessage && !['error', 'permissions-error'].includes(bucketStatus) && (
            <div className="mt-3 flex items-center text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleImageUpload;
