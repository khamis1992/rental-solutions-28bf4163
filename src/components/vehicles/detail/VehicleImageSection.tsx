
import React from 'react';
import { Car } from 'lucide-react';

interface VehicleImageSectionProps {
  imageUrl?: string | null;
  make?: string;
  model?: string;
}

export const VehicleImageSection: React.FC<VehicleImageSectionProps> = ({ 
  imageUrl, 
  make, 
  model 
}) => {
  return (
    <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
      {imageUrl ? (
        <img 
          src={imageUrl}
          alt={`${make} ${model}`}
          className="object-contain w-full h-full rounded-md"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <Car className="h-16 w-16 mb-2" />
          <p>No image available</p>
        </div>
      )}
    </div>
  );
};
