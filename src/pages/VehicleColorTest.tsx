
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { VehicleColorPreview } from '@/components/vehicles/VehicleColorPreview';
import { ColorAdjustedImage } from '@/components/vehicles/ColorAdjustedImage';
import { getColorHex, COLOR_MAP } from '@/lib/color-utils';

const VehicleColorTest = () => {
  const [selectedImage, setSelectedImage] = useState<string>('/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png');
  const [selectedColor, setSelectedColor] = useState<string>('red');
  const [colorMethod, setColorMethod] = useState<'filter' | 'overlay' | 'none'>('filter');
  
  const carImages = [
    { 
      name: 'T77 SUV', 
      src: '/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png' 
    },
    { 
      name: 'GAC GS3', 
      src: '/lovable-uploads/3a9a07d4-ef18-41ea-ac89-3b22acd724d0.png' 
    },
    { 
      name: 'MG5', 
      src: '/lovable-uploads/355f1572-39eb-4db2-8d1b-0da5b1ce4d00.png' 
    },
    { 
      name: 'B70', 
      src: '/lovable-uploads/977480e0-3193-4751-b9d0-8172d78e42e5.png' 
    },
    { 
      name: 'T33', 
      src: '/lovable-uploads/a27a9638-2a8b-4f23-b9fb-1c311298b745.png' 
    }
  ];
  
  return (
    <PageContainer>
      <SectionHeader 
        title="Vehicle Color Visualizer"
        description="Test the dynamic color changer for vehicle images"
        icon={Palette}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Select Vehicle Model</Label>
                <Select 
                  value={selectedImage} 
                  onValueChange={setSelectedImage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an image" />
                  </SelectTrigger>
                  <SelectContent>
                    {carImages.map(image => (
                      <SelectItem key={image.src} value={image.src}>
                        {image.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Vehicle Color</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input 
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="Enter color name"
                  />
                  
                  <Select 
                    value={colorMethod} 
                    onValueChange={(value) => setColorMethod(value as 'filter' | 'overlay' | 'none')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Color method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filter">Filter</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div 
                    className="h-10 rounded-md border flex items-center justify-center"
                    style={{ 
                      backgroundColor: getColorHex(selectedColor) || '#ccc',
                      color: getColorHex(selectedColor) ? 
                        (selectedColor.toLowerCase() === 'white' ? '#000' : '#fff') : '#000'
                    }}
                  >
                    {selectedColor}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <VehicleColorPreview
                imageSrc={selectedImage}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
              
              <div className="mt-4">
                <Label className="text-sm mb-2 block">Available Colors</Label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                  {Object.keys(COLOR_MAP).map(color => (
                    <Button
                      key={color}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs justify-start p-2"
                      onClick={() => setSelectedColor(color)}
                    >
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: COLOR_MAP[color] }}
                      />
                      {color}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="filter" className="h-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="filter">Filter Method</TabsTrigger>
                <TabsTrigger value="overlay">Overlay Method</TabsTrigger>
                <TabsTrigger value="original">Original</TabsTrigger>
              </TabsList>
              
              <TabsContent value="filter" className="h-64 border rounded-lg overflow-hidden">
                <ColorAdjustedImage 
                  src={selectedImage}
                  alt="Filter preview"
                  vehicle={{ color: selectedColor }}
                  forceMethod="filter"
                />
              </TabsContent>
              
              <TabsContent value="overlay" className="h-64 border rounded-lg overflow-hidden">
                <ColorAdjustedImage 
                  src={selectedImage}
                  alt="Overlay preview"
                  vehicle={{ color: selectedColor }}
                  forceMethod="overlay"
                />
              </TabsContent>
              
              <TabsContent value="original" className="h-64 border rounded-lg overflow-hidden">
                <img 
                  src={selectedImage} 
                  alt="Original image" 
                  className="w-full h-full object-cover"
                />
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                The color changer uses two different methods:
              </p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li><strong>Filter Method:</strong> Uses CSS filters like hue-rotate and saturate to transform the image colors.</li>
                <li><strong>Overlay Method:</strong> Applies a semi-transparent color layer while preserving highlights and shadows.</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Different colors work better with different methods. Try both to see which gives the best result.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default VehicleColorTest;
