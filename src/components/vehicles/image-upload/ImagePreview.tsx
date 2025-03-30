
import React from 'react';
import { CustomButton } from '@/components/ui/custom-button';
import { X } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onRemove }) => {
  return (
    <div className="relative">
      <img 
        src={imageUrl} 
        alt="Vehicle preview" 
        className="mx-auto max-h-64 rounded-md object-contain"
        onError={(e) => {
          console.error('Failed to load image:', imageUrl);
          e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
        }}
      />
      <CustomButton
        type="button"
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove image</span>
      </CustomButton>
    </div>
  );
};

export default ImagePreview;
