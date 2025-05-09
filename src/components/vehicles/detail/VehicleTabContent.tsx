
import React from 'react';
import { FileText, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

export const VehicleTabContent: React.FC = () => {
  return (
    <Tabs defaultValue="agreements" className="w-full">
      <TabsList>
        <TabsTrigger value="agreements" className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          Agreements
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center">
          <Wrench className="mr-2 h-4 w-4" />
          Maintenance History
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="agreements" className="space-y-4">
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Agreement history will be displayed here
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="maintenance" className="space-y-4">
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Maintenance history will be displayed here
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
