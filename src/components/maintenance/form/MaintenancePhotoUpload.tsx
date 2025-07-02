import React, { useState, useCallback } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

import { Card, CardContent } from '@/components/ui/card';
import { UseFormReturn } from 'react-hook-form';
import { Upload, X } from 'lucide-react';

interface MaintenancePhotoUploadProps {
  form: UseFormReturn<any>;
}

const MaintenancePhotoUpload: React.FC<MaintenancePhotoUploadProps> = ({ form }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPreviewUrls: string[] = [];
    const existingPhotos = form.getValues('photos') || [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newPreviewUrls.push(previewUrl);
      }
    }

    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    form.setValue('photos', [...existingPhotos, ...Array.from(files)]);
    setUploading(false);
  }, [form]);

  const removePhoto = useCallback((index: number) => {
    const currentPhotos = form.getValues('photos') || [];
    const newPhotos = currentPhotos.filter((_: any, i: number) => i !== index);
    form.setValue('photos', newPhotos);
    
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  }, [form]);

  return (
    <div dir="rtl" className="space-y-4">
      <FormField
        control={form.control}
        name="photos"
        render={() => (
          <FormItem>
            <FormLabel className="text-right">صور الصيانة</FormLabel>
            <FormControl>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        className="pointer-events-none"
                      >
                        <Upload className="h-4 w-4 ml-2" />
                        {uploading ? 'جاري الرفع...' : 'رفع الصور'}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG، JPG، GIF حتى 10MB
                    </p>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-2">
                          <img
                            src={url}
                            alt={`صورة الصيانة ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 left-1 h-6 w-6 p-0"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default MaintenancePhotoUpload; 