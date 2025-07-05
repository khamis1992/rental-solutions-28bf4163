
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const UpcomingDeadlines = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
        <CardDescription>Legal deadlines requiring action</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          <div className="p-3 rounded-md border-l-4 border-red-500 bg-red-50">
            <div className="flex justify-between">
              <h4 className="font-medium">Court Filing Deadline</h4>
              <Badge variant="destructive">Tomorrow</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Case #LC-290 response due</p>
            <Button variant="link" className="p-0 h-6 mt-1 text-xs text-red-600">Take action →</Button>
          </div>
          
          <div className="p-3 rounded-md border-l-4 border-amber-500 bg-amber-50">
            <div className="flex justify-between">
              <h4 className="font-medium">Insurance Renewal</h4>
              <Badge className="bg-amber-500">3 days</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Fleet vehicle insurance policy expires</p>
            <Button variant="link" className="p-0 h-6 mt-1 text-xs text-amber-600">Review →</Button>
          </div>
          
          <div className="p-3 rounded-md border-l-4 border-blue-500 bg-blue-50">
            <div className="flex justify-between">
              <h4 className="font-medium">Settlement Negotiation</h4>
              <Badge className="bg-blue-500">Next week</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Customer #2356 contract dispute</p>
            <Button variant="link" className="p-0 h-6 mt-1 text-xs text-blue-600">View details →</Button>
          </div>
          
          <div className="p-3 rounded-md border-l-4 border-green-500 bg-green-50">
            <div className="flex justify-between">
              <h4 className="font-medium">Regulatory Compliance</h4>
              <Badge className="bg-green-500">2 weeks</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Annual compliance report submission</p>
            <Button variant="link" className="p-0 h-6 mt-1 text-xs text-green-600">Start preparation →</Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View All Deadlines</Button>
      </CardFooter>
    </Card>
  );
};
