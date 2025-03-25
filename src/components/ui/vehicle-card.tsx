
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleUser, Calendar, MapPin, Fuel, Activity } from 'lucide-react';
import { CustomButton } from './custom-button';
import { VehicleStatus } from '@/types/vehicle';
import { getVehicleImageByPrefix, getModelSpecificImage } from '@/lib/vehicles/vehicle-storage';
import { ColorAdjustedImage } from '@/components/vehicles/ColorAdjustedImage';

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
  color?: string;
}

const VehicleCard = ({
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
  color,
}: VehicleCardProps) => {
  const [actualImageUrl, setActualImageUrl] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState(true);
  
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    reserved: 'bg-purple-100 text-purple-800',
    maintenance: 'bg-amber-100 text-amber-800',
    police_station: 'bg-sky-100 text-sky-800',
    accident: 'bg-red-100 text-red-800',
    stolen: 'bg-rose-100 text-rose-800',
    retired: 'bg-gray-100 text-gray-800'
  };

  const defaultCarImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
  
  useEffect(() => {
    async function loadVehicleImage() {
      setIsImageLoading(true);
      
      try {
        // Check model-specific images
        const modelToCheck = model || '';
        
        // Models to check for specific storage images
        const modelTypes = ['B70', 'T33', 'T99', 'A30', 'TERRITORY', 'GS3', 'MG5', 'Alsvin'];
        
        // Find if current vehicle matches any known model
        const matchedModelType = modelTypes.find(type => 
          modelToCheck.toUpperCase().includes(type) || 
          modelToCheck.toLowerCase().includes(type.toLowerCase())
        );
        
        if (matchedModelType) {
          console.log(`Vehicle matched model type: ${matchedModelType}`);
          const modelImage = await getModelSpecificImage(matchedModelType);
          
          if (modelImage) {
            console.log(`Using ${matchedModelType} image from storage:`, modelImage);
            setActualImageUrl(modelImage);
            setIsImageLoading(false);
            return;
          }
        }
        
        // Then check if we have a direct URL
        if (imageUrl && imageUrl.startsWith('http')) {
          setActualImageUrl(imageUrl);
          setIsImageLoading(false);
          return;
        }
        
        // Then try to get an image by vehicle ID
        const storageImage = await getVehicleImageByPrefix(id);
        if (storageImage) {
          setActualImageUrl(storageImage);
          setIsImageLoading(false);
          return;
        }
        
        // Finally, fall back to model-specific images from public folder
        fallbackToModelImages();
      } catch (error) {
        console.error('Error loading vehicle image:', error);
        fallbackToModelImages();
      }
    }
    
    loadVehicleImage();
  }, [id, imageUrl, make, model]);
  
  const fallbackToModelImages = () => {
    const t77Image = '/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png';
    const gacImage = '/lovable-uploads/e38aaeba-21fd-492e-9f43-2d798fe0edfc.png';
    const mgImage = '/lovable-uploads/5384d3e3-5c1c-4588-b472-64e08eeeac72.png';
    const mg5Image = '/lovable-uploads/355f1572-39eb-4db2-8d1b-0da5b1ce4d00.png';
    const gs3Image = '/lovable-uploads/3a9a07d4-ef18-41ea-ac89-3b22acd724d0.png';
    const b70Image = '/lovable-uploads/977480e0-3193-4751-b9d0-8172d78e42e5.png';
    const t33Image = '/lovable-uploads/a27a9638-2a8b-4f23-b9fb-1c311298b745.png';
    
    try {
      const makeLower = (make || '').toString().toLowerCase().trim();
      const modelLower = (model || '').toString().toLowerCase().trim();
      
      console.log('Vehicle card make/model:', makeLower, modelLower);
      
      if (modelLower.includes('b70') || modelLower === 'b70') {
        setActualImageUrl(b70Image);
        console.log('Using B70 fallback image');
      }
      else if (modelLower.includes('t33') || modelLower === 't33') {
        setActualImageUrl(t33Image);
        console.log('Using T33 fallback image');
      }
      else if (modelLower.includes('t77') || modelLower === 't77') {
        setActualImageUrl(t77Image);
        console.log('Using T77 fallback image');
      } 
      else if (makeLower.includes('gac') && modelLower.includes('gs3')) {
        setActualImageUrl(gs3Image);
        console.log('Using GAC GS3 fallback image');
      }
      else if (modelLower.includes('gs3') || modelLower === 'gs3') {
        setActualImageUrl(gs3Image);
        console.log('Using GS3 fallback image');
      }
      else if (makeLower.includes('gac')) {
        setActualImageUrl(gacImage);
        console.log('Using generic GAC fallback image');
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
          setActualImageUrl(mg5Image);
          console.log('Using MG5 specific fallback image:', mg5Image);
        } else {
          setActualImageUrl(mgImage);
          console.log('Using generic MG fallback image:', mgImage);
        }
      } 
      else {
        setActualImageUrl(defaultCarImage);
      }
    } catch (error) {
      console.error('Error setting vehicle image:', error);
      setActualImageUrl(defaultCarImage);
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border border-border/60 transition-all duration-300 hover:shadow-card", 
      "card-transition", 
      className
    )}>
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
        {isImageLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <ColorAdjustedImage 
            src={actualImageUrl || defaultCarImage}
            alt={`${make} ${model}`}
            color={color}
            className="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-105"
            onError={(e) => {
              console.log('Image failed to load, using fallback:', actualImageUrl);
              setActualImageUrl(defaultCarImage);
            }}
          />
        )}
        <Badge className={cn("absolute top-3 right-3 z-20", statusColors[status])}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{make} {model}</h3>
            <div className="flex items-center mt-1 text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="text-sm">{year}</span>
              <span className="mx-2 text-muted-foreground">•</span>
              <span className="text-sm font-medium">{licensePlate}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {location && (
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 mr-1.5" />
              <span className="truncate">{location}</span>
            </div>
          )}
          
          {fuelLevel !== undefined && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Fuel className="h-4 w-4 mr-1.5" />
              <span>{fuelLevel}%</span>
            </div>
          )}
          
          {mileage !== undefined && mileage !== null && (
            <div className="flex items-center text-muted-foreground text-sm">
              <Activity className="h-4 w-4 mr-1.5" />
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
        >
          View Details
        </CustomButton>
      </CardFooter>
    </Card>
  );
};

export { VehicleCard };
