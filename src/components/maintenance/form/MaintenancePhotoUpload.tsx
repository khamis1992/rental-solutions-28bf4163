import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type MaintenancePhotoUploadProps = {
  photos: string[];
  onChange: (urls: string[]) => void;
  maintenanceId?: string;
};

const MaintenancePhotoUpload: React.FC<MaintenancePhotoUploadProps> = ({ photos, onChange, maintenanceId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `maintenance/${maintenanceId || 'new'}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('maintenance').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('maintenance').getPublicUrl(filePath);
      onChange([...photos, publicUrl]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (url: string) => {
    onChange(photos.filter((p) => p !== url));
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium mb-1">Photos (optional)</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((url, idx) => (
          <div key={idx} className="relative group">
            <img src={url} alt="Maintenance" className="w-20 h-20 object-cover rounded" />
            <button type="button" className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hidden group-hover:block" onClick={() => handleRemove(url)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}
      </div>
      <label htmlFor="maintenance-photo-upload" className="flex items-center gap-2 cursor-pointer text-blue-600">
        <UploadCloud className="w-5 h-5" />
        <span>{isUploading ? 'Uploading...' : 'Add Photo'}</span>
        <Input id="maintenance-photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
      </label>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default MaintenancePhotoUpload; 