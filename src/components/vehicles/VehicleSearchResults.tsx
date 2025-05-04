
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface VehicleSearchResultsProps {
  results: any[];
  onSelect: (vehicle: any) => void;
  isLoading: boolean;
}

export const VehicleSearchResults: React.FC<VehicleSearchResultsProps> = ({ 
  results, 
  onSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-md p-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="border rounded-md p-4 text-center text-gray-500">
        No vehicles found
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
      {results.map((vehicle) => (
        <div 
          key={vehicle.id}
          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
          onClick={() => onSelect(vehicle)}
        >
          <div className="font-medium">
            {vehicle.make} {vehicle.model} ({vehicle.license_plate})
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-2 items-center">
            <span>Year: {vehicle.year}</span>
            <span className="hidden sm:inline">•</span>
            <span>VIN: {vehicle.vin?.substring(0, 8)}...</span>
            <Badge className={
              vehicle.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-200" : 
              "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }>
              {vehicle.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
