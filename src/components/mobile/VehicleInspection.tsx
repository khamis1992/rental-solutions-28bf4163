
import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, X } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface InspectionItem {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photos: string[];
}

export function VehicleInspection({ vehicle }: { vehicle: Vehicle }) {
  const isMobile = useIsMobile();
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { name: 'Exterior Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Interior Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Tire Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Fluid Levels', status: 'pending', notes: '', photos: [] }
  ]);

  const handlePhotoCapture = async (itemIndex: number) => {
    // Mobile photo capture implementation
    if (!isMobile) return;
    
    try {
      // Photo capture logic here
      const photoUrl = "captured_photo_url";
      const updatedItems = [...inspectionItems];
      updatedItems[itemIndex].photos.push(photoUrl);
      setInspectionItems(updatedItems);
    } catch (error) {
      console.error('Photo capture failed:', error);
    }
  };

  const updateItemStatus = (index: number, status: 'pass' | 'fail' | 'pending') => {
    const updatedItems = [...inspectionItems];
    updatedItems[index].status = status;
    setInspectionItems(updatedItems);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold mb-4">Vehicle Inspection: {vehicle.make} {vehicle.model}</h2>
      
      {inspectionItems.map((item, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{item.name}</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={item.status === 'pass' ? 'default' : 'outline'}
                onClick={() => updateItemStatus(index, 'pass')}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={item.status === 'fail' ? 'destructive' : 'outline'}
                onClick={() => updateItemStatus(index, 'fail')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Input
            placeholder="Add notes..."
            value={item.notes}
            onChange={(e) => {
              const updatedItems = [...inspectionItems];
              updatedItems[index].notes = e.target.value;
              setInspectionItems(updatedItems);
            }}
            className="mb-2"
          />
          
          {isMobile && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handlePhotoCapture(index)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          )}
        </Card>
      ))}
      
      <Button className="w-full mt-4">Submit Inspection</Button>
    </div>
  );
}
