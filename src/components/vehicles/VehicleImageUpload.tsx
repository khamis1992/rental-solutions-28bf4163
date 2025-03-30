
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { ensureVehicleImagesBucket } from '@/lib/vehicles/vehicle-storage';
import { supabase } from '@/integrations/supabase/client';
import StorageConfigAlert from './image-upload/StorageConfigAlert';
import ImagePreview from './image-upload/ImagePreview';
import UploadPlaceholder from './image-upload/UploadPlaceholder';
import UploadLoader from './image-upload/UploadLoader';

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
    checkBucket();
    verifyBucketAccess();
  }, []);

  useEffect(() => {
    // Update preview URL if initialImageUrl changes
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

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
        <UploadLoader />
      ) : previewUrl ? (
        <ImagePreview 
          imageUrl={previewUrl} 
          onRemove={handleRemoveImage} 
        />
      ) : (
        <div className="py-6 flex flex-col items-center">
          {(bucketStatus === 'error' || bucketStatus === 'permissions-error') ? (
            <StorageConfigAlert 
              bucketStatus={bucketStatus}
              errorMessage={errorMessage}
              onRetry={handleRetryBucketSetup}
            />
          ) : (
            <UploadPlaceholder
              bucketStatus={bucketStatus}
              errorMessage={errorMessage}
              isChecking={bucketStatus === 'checking'}
              onClick={handleButtonClick}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleImageUpload;
