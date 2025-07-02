
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VehicleImageGalleryProps {
  mainImage?: string | null;
  additionalImages?: string[];
  className?: string;
}

export const VehicleImageGallery: React.FC<VehicleImageGalleryProps> = ({
  mainImage,
  additionalImages = [],
  className
}) => {
  const [currentImage, setCurrentImage] = useState(mainImage);
  const [error, setError] = useState(false);
  
  const allImages = [mainImage, ...(additionalImages || [])].filter(Boolean) as string[];
  
  const currentIndex = currentImage ? allImages.indexOf(currentImage) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allImages.length - 1 && currentIndex !== -1;
  
  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentImage(allImages[currentIndex - 1]);
      setError(false);
    }
  };
  
  const handleNext = () => {
    if (hasNext) {
      setCurrentImage(allImages[currentIndex + 1]);
      setError(false);
    }
  };
  
  const handleThumbnailClick = (image: string) => {
    setCurrentImage(image);
    setError(false);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
        {error || !currentImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Image className="h-16 w-16 mb-2 opacity-20" />
            <p>No image available</p>
          </div>
        ) : (
          <img
            src={currentImage}
            alt="Vehicle"
            className="object-contain w-full h-full"
            onError={() => setError(true)}
          />
        )}
        
        {allImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
                !hasPrevious && "opacity-50 cursor-not-allowed"
              )}
              onClick={handlePrevious}
              disabled={!hasPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
                !hasNext && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1 px-1">
          {allImages.map((image, index) => (
            <div
              key={index}
              className={cn(
                "h-16 w-16 rounded-md overflow-hidden cursor-pointer flex-shrink-0 border-2",
                currentImage === image ? "border-primary" : "border-transparent"
              )}
              onClick={() => handleThumbnailClick(image)}
            >
              <img
                src={image}
                alt={`Vehicle thumbnail ${index + 1}`}
                className="object-cover w-full h-full"
                onError={(e) => {
                  // Hide thumbnail on error
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
