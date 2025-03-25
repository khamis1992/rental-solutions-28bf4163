
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getColorHex, getColorFilter, isDarkColor, getColorAdjustmentMethod } from '@/lib/color-utils';
import { Vehicle } from '@/types/vehicle';

interface ColorAdjustedImageProps {
  src: string;
  alt: string;
  vehicle: Vehicle;
  className?: string;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
  forceMethod?: 'filter' | 'overlay' | 'none' | 'auto';
}

export const ColorAdjustedImage: React.FC<ColorAdjustedImageProps> = ({
  src,
  alt,
  vehicle,
  className,
  onLoad,
  onError,
  fallbackSrc = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop',
  forceMethod = 'auto',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [adjustmentMethod, setAdjustmentMethod] = useState<'filter' | 'overlay' | 'none'>('none');
  
  useEffect(() => {
    // Determine the best method to adjust color
    if (forceMethod !== 'auto') {
      setAdjustmentMethod(forceMethod === 'auto' ? 'none' : forceMethod);
    } else {
      setAdjustmentMethod(getColorAdjustmentMethod(vehicle));
    }
  }, [vehicle, forceMethod]);
  
  const colorHex = getColorHex(vehicle.color);
  const colorFilter = getColorFilter(vehicle.color);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', src);
    setImageSrc(fallbackSrc);
    if (onError) onError(e);
  };
  
  return (
    <div className="relative overflow-hidden">
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          adjustmentMethod === 'filter' && colorFilter && "transition-filter",
          className
        )}
        style={adjustmentMethod === 'filter' && colorFilter ? { filter: colorFilter } : {}}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Color overlay for overlay method */}
      {adjustmentMethod === 'overlay' && colorHex && imageLoaded && (
        <div 
          className="absolute inset-0 mix-blend-color transition-opacity duration-300"
          style={{ backgroundColor: colorHex, opacity: 0.7 }}
        />
      )}
      
      {/* Original image shine overlay to maintain highlights */}
      {adjustmentMethod === 'overlay' && colorHex && imageLoaded && (
        <div 
          className="absolute inset-0 mix-blend-soft-light opacity-50"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      )}
    </div>
  );
};
