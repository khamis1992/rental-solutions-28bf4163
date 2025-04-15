
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, Loader2 } from 'lucide-react';

export interface VehicleImageUploadProps {
  onImageSelected?: (file: File) => void;
  initialImageUrl?: string;
  className?: string;
  onUpload?: (url: string) => void;  // Add onUpload prop
}

export const VehicleImageUpload: React.FC<VehicleImageUploadProps> = ({ 
  onImageSelected, 
  initialImageUrl, 
  className,
  onUpload
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Notify parent component
      if (onImageSelected) {
        onImageSelected(file);
      }

      // Support legacy onUpload prop
      if (onUpload) {
        onUpload(url);
      }
      
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <div 
        className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-md mb-4 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50"
        onClick={handleClick}
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">Uploading...</span>
          </div>
        ) : previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Vehicle preview" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <ImageIcon className="w-10 h-10 mb-2" />
            <span>Click to upload vehicle image</span>
          </div>
        )}
      </div>
      
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
      >
        {previewUrl ? 'Change Image' : 'Upload Image'}
      </Button>
    </div>
  );
};

export default VehicleImageUpload;
