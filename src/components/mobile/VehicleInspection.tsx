// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, X } from 'lucide-react';
import { VehicleRow } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InspectionItem {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  notes: string;
  photos: string[];
}

export function VehicleInspection({ vehicle }: { vehicle: VehicleRow }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { name: 'Exterior Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Interior Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Tire Condition', status: 'pending', notes: '', photos: [] },
    { name: 'Fluid Levels', status: 'pending', notes: '', photos: [] },
    { name: 'Lights & Signals', status: 'pending', notes: '', photos: [] },
    { name: 'Brakes', status: 'pending', notes: '', photos: [] },
    { name: 'Dashboard Warning Lights', status: 'pending', notes: '', photos: [] }
  ]);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const handlePhotoCapture = async (itemIndex: number) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `vehicle-inspections/${vehicle.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('inspections')
          .upload(filePath, file);

        if (uploadError) {
          toast.error('Failed to upload photo');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('inspections')
          .getPublicUrl(filePath);

        const updatedItems = [...inspectionItems];
        updatedItems[itemIndex].photos.push(publicUrl);
        setInspectionItems(updatedItems);
        toast.success('Photo uploaded successfully');
      };

      input.click();
    } catch (error) {
      console.error('Photo capture failed:', error);
      toast.error('Failed to capture photo');
    }
  };

  const updateItemStatus = (index: number, status: 'pass' | 'fail' | 'pending') => {
    const updatedItems = [...inspectionItems];
    updatedItems[index].status = status;
    setInspectionItems(updatedItems);
  };

  const savePendingInspection = (data: any) => {
    const existing = JSON.parse(localStorage.getItem('pendingInspections') || '[]');
    existing.push(data);
    localStorage.setItem('pendingInspections', JSON.stringify(existing));
  };

  useEffect(() => {
    const syncPending = async () => {
      if (!navigator.onLine) return;
      const pending = JSON.parse(localStorage.getItem('pendingInspections') || '[]');
      if (!pending.length) return;
      for (const item of pending) {
        await supabase.from('vehicle_inspections').insert(item);
      }
      localStorage.removeItem('pendingInspections');
    };
    window.addEventListener('online', syncPending);
    syncPending();
    return () => window.removeEventListener('online', syncPending);
  }, []);

  const handleSubmitInspection = async () => {
    setIsSubmitting(true);
    try {
      const inspection = {
        vehicle_id: vehicle.id,
        inspection_date: new Date().toISOString(),
        inspection_items: inspectionItems,
        status: inspectionItems.every(item => item.status === 'pass') ? 'passed' : 'failed',
        inspector_notes: inspectionItems.map(item => item.notes).filter(Boolean).join('\n'),
        inspection_photos: inspectionItems.flatMap(item => item.photos),
        location
      };

      const { error } = await supabase
        .from('vehicle_inspections')
        .insert([inspection]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Inspection submitted successfully');
    } catch (error) {
      console.error('Failed to submit inspection:', error);
      savePendingInspection({
        vehicle_id: vehicle.id,
        inspection_date: new Date().toISOString(),
        inspection_items: inspectionItems,
        status: inspectionItems.every(item => item.status === 'pass') ? 'passed' : 'failed',
        inspector_notes: inspectionItems.map(item => item.notes).filter(Boolean).join('\n'),
        inspection_photos: inspectionItems.flatMap(item => item.photos),
        location
      });
      toast.error('Failed to submit inspection. Saved offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-green-100 p-4 mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Inspection submitted!</h2>
        <p className="mb-6 text-gray-600">Thank you. The inspection has been saved.</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/field-ops')}>Back to Dashboard</Button>
          <Button variant="outline" onClick={() => { setSubmitted(false); }}>Start Another</Button>
        </div>
      </div>
    );
  }

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
          
          <div className="flex flex-wrap gap-2 mb-2">
            {item.photos.map((photo, photoIndex) => (
              <img
                key={photoIndex}
                src={photo}
                alt={`Inspection photo ${photoIndex + 1}`}
                className="w-20 h-20 object-cover rounded"
              />
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => handlePhotoCapture(index)}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </Card>
      ))}
      
      <Button 
        className="w-full mt-4" 
        onClick={handleSubmitInspection}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
      </Button>
    </div>
  );
}
