import React, { useState, useRef } from 'react';
import { Upload, X, Image, AlertCircle, Loader2 } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageCache = new Map<string, string>();

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleFile = async (file: File | null) => {
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
        const cacheKey = await generateFileHash(file);
        if (imageCache.has(cacheKey)) {
          setPreviewUrl(imageCache.get(cacheKey));
          setIsLoading(false);
          return;
        }

        const optimizedImage = await compressImage(file);
        // Create preview URL from optimized image
        const url = URL.createObjectURL(optimizedImage);
        setPreviewUrl(url);
        imageCache.set(cacheKey, url); // Add to cache

        // Pass the optimized file back to parent component
        onImageSelected(new File([optimizedImage], file.name, { type: 'image/jpeg' }));
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

  async function generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

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
    if (previewUrl) {
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
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.opacity = '1';
            }}
            style={{
              opacity: '0',
              transition: 'opacity 0.3s ease-in-out',
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
          <Image className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop an image here, or click to select
          </p>
          <CustomButton 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleButtonClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </CustomButton>
          <p className="text-xs text-muted-foreground mt-3">
            JPG, PNG or WEBP (max. 5MB)
          </p>

          {errorMessage && (
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