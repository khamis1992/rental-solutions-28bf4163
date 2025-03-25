
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { ColorAdjustedImage } from './ColorAdjustedImage';
import { Button } from '@/components/ui/button';
import { Check, Palette } from 'lucide-react';
import { COLOR_MAP, getColorHex } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

interface VehicleColorPreviewProps {
  imageSrc: string;
  selectedColor: string;
  onColorChange?: (color: string) => void;
}

export const VehicleColorPreview: React.FC<VehicleColorPreviewProps> = ({
  imageSrc,
  selectedColor,
  onColorChange
}) => {
  const [previewMethod, setPreviewMethod] = useState<'filter' | 'overlay' | 'none'>('filter');
  const defaultCarImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
  
  // Popular colors for quick selection
  const popularColors = [
    'red', 'blue', 'black', 'white', 'silver', 
    'gray', 'green', 'yellow', 'orange', 'purple',
    'brown', 'gold', 'beige', 'burgundy', 'navy'
  ];
  
  const togglePreviewMethod = () => {
    setPreviewMethod(prev => prev === 'filter' ? 'overlay' : 'filter');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Vehicle Color Preview</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={togglePreviewMethod}
          className="text-xs"
        >
          Method: {previewMethod === 'filter' ? 'Filter' : 'Overlay'}
        </Button>
      </div>
      
      <div className="rounded-lg overflow-hidden border border-border h-32 md:h-40">
        <ColorAdjustedImage
          src={imageSrc || defaultCarImage}
          alt="Vehicle color preview"
          color={selectedColor}
          forceMethod={previewMethod}
        />
      </div>
      
      <div>
        <Label className="text-sm mb-2 block">Quick Colors</Label>
        <div className="grid grid-cols-5 gap-2">
          {popularColors.map(color => {
            const colorHex = getColorHex(color) || '#ccc';
            const isSelected = color.toLowerCase() === selectedColor?.toLowerCase();
            
            return (
              <button
                key={color}
                className={cn(
                  "h-8 rounded transition-all flex items-center justify-center",
                  isSelected ? "ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                )}
                style={{ backgroundColor: colorHex }}
                onClick={() => onColorChange && onColorChange(color)}
                title={color.charAt(0).toUpperCase() + color.slice(1)}
              >
                {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Select a color to see how your vehicle will appear with that color.</p>
        <p>Actual results may vary based on the original image and vehicle model.</p>
      </div>
    </div>
  );
};
