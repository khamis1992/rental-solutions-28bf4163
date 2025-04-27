
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Settings } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  licensePlate: string;
  status: VehicleStatus;
  imageUrl: string;
  dailyRate?: number;
  transmission?: string;
  fuelType?: string;
  className?: string;
  onSelect?: (id: string) => void;
}

export function VehicleCard({
  id,
  make,
  model,
  variant,
  year,
  imageUrl,
  dailyRate,
  transmission,
  fuelType,
  className,
  onSelect,
}: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const defaultCarImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';

  return (
    <Card 
      className={cn(
        "overflow-hidden border border-border/60 hover:shadow-lg transition-all duration-300",
        className
      )}
      onClick={() => onSelect?.(id)}
    >
      <div className="relative">
        <img
          src={imageUrl || defaultCarImage}
          alt={`${make} ${model}`}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <Heart 
            className={cn(
              "h-5 w-5", 
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            )} 
          />
        </button>
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{`${make} ${model}`}</h3>
            {variant && (
              <p className="text-sm text-muted-foreground">{variant}</p>
            )}
          </div>
          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-400 mr-1" />
            <span>4.8</span>
          </div>
        </div>

        {dailyRate && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">${dailyRate}</span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {transmission && (
            <Badge variant="secondary" className="rounded-full">
              {transmission}
            </Badge>
          )}
          {fuelType && (
            <Badge variant="secondary" className="rounded-full">
              {fuelType}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
