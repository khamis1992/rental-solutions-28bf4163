import React, { useEffect, useState, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarIcon, Calendar, MapPin, Fuel, Activity, Loader2 } from 'lucide-react';
import { CustomButton } from './custom-button';
import { VehicleStatus } from '@/types/vehicle';
import { getVehicleImageByPrefix, getModelSpecificImage } from '@/lib/vehicles/vehicle-storage';

// Define model image mapping outside component to avoid recreating on each render
const MODEL_IMAGES = {
  t77: '/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png',
  gac: '/lovable-uploads/e38aaeba-21fd-492e-9f43-2d798fe0edfc.png',
  mg: '/lovable-uploads/5384d3e3-5c1c-4588-b472-64e08eeeac72.png',
  mg5: '/lovable-uploads/355f1572-39eb-4db2-8d1b-0da5b1ce4d00.png',
  gs3: '/lovable-uploads/3a9a07d4-ef18-41ea-ac89-3b22acd724d0.png',
  b70: '/lovable-uploads/977480e0-3193-4751-b9d0-8172d78e42e5.png',
  t33: '/lovable-uploads/a27a9638-2a8b-4f23-b9fb-1c311298b745.png',
};

// Define model types to check for specific storage images
const MODEL_TYPES = ['B70', 'T33', 'T99', 'A30', 'TERRITORY', 'GS3', 'MG5', 'Alsvin'];

// Define status colors mapping
const STATUS_COLORS = {
  available: 'bg-green-100 text-green-800',
  rented: 'bg-blue-100 text-blue-800',
  reserved: 'bg-purple-100 text-purple-800',
  maintenance: 'bg-amber-100 text-amber-800',
  police_station: 'bg-sky-100 text-sky-800',
  accident: 'bg-red-100 text-red-800',
  stolen: 'bg-rose-100 text-rose-800',
  retired: 'bg-gray-100 text-gray-800'
};

const DEFAULT_CAR_IMAGE = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl: string;
  location?: string;
  fuelLevel?: number;
  mileage?: number | null;
  className?: string;
  onSelect?: (id: string) => void;
}

const VehicleCard = memo(({
  id,
  make,
  model,
  year,
  licensePlate,
  status,
  imageUrl,
  location,
  fuelLevel,
  mileage,
  className,
  onSelect,
}: VehicleCardProps) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Memoize the fallback function to avoid recreating it on each render
  const fallbackToModelImages = useCallback(() => {
    try {
      const makeLower = (make || '').toString().toLowerCase().trim();
      const modelLower = (model || '').toString().toLowerCase().trim();

      if (modelLower.includes('b70') || modelLower === 'b70') {
        setActualImageUrl(MODEL_IMAGES.b70);
      }
      else if (modelLower.includes('t33') || modelLower === 't33') {
        setActualImageUrl(MODEL_IMAGES.t33);
      }
      else if (modelLower.includes('t77') || modelLower === 't77') {
        setActualImageUrl(MODEL_IMAGES.t77);
      }
      else if (makeLower.includes('gac') && modelLower.includes('gs3')) {
        setActualImageUrl(MODEL_IMAGES.gs3);
      }
      else if (modelLower.includes('gs3') || modelLower === 'gs3') {
        setActualImageUrl(MODEL_IMAGES.gs3);
      }
      else if (makeLower.includes('gac')) {
        setActualImageUrl(MODEL_IMAGES.gac);
      }
      else if (
        makeLower === 'mg' ||
        makeLower.startsWith('mg ') ||
        modelLower.startsWith('mg')
      ) {
        if (
          modelLower.includes('5') ||
          modelLower.includes('mg5') ||
          makeLower.includes('mg5') ||
          (makeLower === 'mg' && modelLower === '5')
        ) {
          setActualImageUrl(MODEL_IMAGES.mg5);
        } else {
          setActualImageUrl(MODEL_IMAGES.mg);
        }
      }
      else {
        setActualImageUrl(DEFAULT_CAR_IMAGE);
      }
    } catch (error) {
      setActualImageUrl(DEFAULT_CAR_IMAGE);
    } finally {
      setIsImageLoading(false);
    }
  }, [make, model]);

  // Load vehicle image
  useEffect(() => {
    let isMounted = true;

    async function loadVehicleImage() {
      if (!isMounted) return;

      setIsImageLoading(true);
      setImageError(false);

      try {
        // First check if we have a direct URL
        if (imageUrl && imageUrl.startsWith('http')) {
          setActualImageUrl(imageUrl);
          setIsImageLoading(false);
          return;
        }

        // Check model-specific images
        const modelToCheck = model || '';

        // Find if current vehicle matches any known model
        const matchedModelType = MODEL_TYPES.find(type =>
          modelToCheck.toUpperCase().includes(type) ||
          modelToCheck.toLowerCase().includes(type.toLowerCase())
        );

        if (matchedModelType) {
          const modelImage = await getModelSpecificImage(matchedModelType);

          if (modelImage && isMounted) {
            setActualImageUrl(modelImage);
            setIsImageLoading(false);
            return;
          }
        }

        // Then try to get an image by vehicle ID
        const storageImage = await getVehicleImageByPrefix(id);
        if (storageImage && isMounted) {
          setActualImageUrl(storageImage);
          setIsImageLoading(false);
          return;
        }

        // Finally, fall back to model-specific images from public folder
        if (isMounted) {
          fallbackToModelImages();
        }
      } catch (error) {
        if (isMounted) {
          fallbackToModelImages();
        }
      }
    }

    loadVehicleImage();

    return () => {
      isMounted = false;
    };
  }, [id, imageUrl, fallbackToModelImages, model]);

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    e.currentTarget.src = DEFAULT_CAR_IMAGE;
  };

  // Format status text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  return (
    <Card className={cn(
      "overflow-hidden border border-border/60 transition-all duration-300 hover:shadow-card",
      "card-transition hover:translate-y-[-2px]",
      className
    )}>
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
        {isImageLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <img
            src={actualImageUrl || DEFAULT_CAR_IMAGE}
            alt={`${make} ${model}`}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105",
              imageError ? "opacity-80" : "opacity-100"
            )}
            onError={handleImageError}
            loading="lazy"
          />
        )}
        <Badge className={cn("absolute top-3 right-3 z-20", STATUS_COLORS[status])}>
          {formatStatus(status)}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold truncate" title={`${make} ${model}`}>
              {make} {model}
            </h3>
            <div className="flex items-center mt-1 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm">{year}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-sm font-medium truncate" title={licensePlate}>
                {licensePlate}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {location && (
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="truncate" title={location}>{location}</span>
            </div>
          )}

          {fuelLevel !== undefined && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Fuel className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>{fuelLevel}%</span>
            </div>
          )}

          {mileage !== undefined && mileage !== null && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span>{mileage.toLocaleString()} km</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0">
        <CustomButton
          className="w-full"
          glossy={true}
          onClick={() => onSelect && onSelect(id)}
          aria-label={`View details for ${make} ${model}`}
        >
          View Details
        </CustomButton>
      </CardFooter>
    </Card>
  );
});

VehicleCard.displayName = 'VehicleCard';

export { VehicleCard };
