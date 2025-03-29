import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Upload, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InspectionFormData {
  odometer_reading: number;
  fuel_level: number;
  photos: FileList;
  inspector_notes: string;
}

export const MobileInspectionForm = ({ vehicleId, onComplete }: { vehicleId: string; onComplete: () => void }) => {
  const [capturing, setCapturing] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<InspectionFormData>();

  const handleCapture = async () => {
    try {
      setCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Implementation for photo capture
      setCapturing(false);
    } catch (error) {
      toast.error('Camera access failed');
      setCapturing(false);
    }
  };

  const onSubmit = async (data: InspectionFormData) => {
    try {
      const inspection = {
        vehicle_id: vehicleId,
        odometer_reading: data.odometer_reading,
        fuel_level: data.fuel_level,
        inspection_photos: photos,
        inspector_notes: data.inspector_notes,
        inspection_type: 'mobile',
        inspection_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_inspections')
        .insert(inspection);

      if (error) throw error;
      
      toast.success('Inspection completed successfully');
      onComplete();
    } catch (error) {
      toast.error('Failed to save inspection');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Odometer Reading (km)</label>
        <Input
          type="number"
          {...register('odometer_reading', { required: true })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fuel Level (%)</label>
        <Input
          type="number"
          {...register('fuel_level', { required: true, min: 0, max: 100 })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Photos</label>
        <div className="flex gap-2">
          <Button 
            type="button"
            onClick={handleCapture}
            disabled={capturing}
          >
            <Camera className="w-4 h-4 mr-2" />
            Capture Photo
          </Button>
          <Input
            type="file"
            accept="image/*"
            multiple
            {...register('photos')}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Button type="button" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img src={photo} alt={`Inspection ${index + 1}`} className="w-full h-32 object-cover rounded" />
              <button
                type="button"
                onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          {...register('inspector_notes')}
          className="w-full h-32 p-2 border rounded"
          placeholder="Enter any damage, concerns, or notable items..."
        />
      </div>

      <Button type="submit" className="w-full">
        Complete Inspection
      </Button>
    </form>
  );
};
