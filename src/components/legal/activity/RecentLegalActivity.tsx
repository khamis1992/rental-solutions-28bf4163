
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, CalendarDays, ShieldAlert, FileText } from 'lucide-react';

export const RecentLegalActivity = () => {
  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Legal Activity</CardTitle>
        <CardDescription>Latest updates and changes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
            <div className="p-2 rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-medium">New Case Created</h4>
                <Badge variant="outline" className="text-xs">2h ago</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Payment default case opened for customer #1254</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs">View case details →</Button>
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
            <div className="p-2 rounded-full bg-amber-500/10 h-10 w-10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-medium">Court Date Scheduled</h4>
                <Badge variant="outline" className="text-xs">Yesterday</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Case #LC-283 hearing scheduled for June 15th</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs">View calendar →</Button>
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
            <div className="p-2 rounded-full bg-green-500/10 h-10 w-10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-medium">Case Resolved</h4>
                <Badge variant="outline" className="text-xs">2 days ago</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Vehicle damage case #LC-276 settled with customer</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs">View settlement →</Button>
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
            <div className="p-2 rounded-full bg-blue-500/10 h-10 w-10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-medium">Document Updated</h4>
                <Badge variant="outline" className="text-xs">3 days ago</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Contract template for commercial vehicles revised</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs">View document →</Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View All Activity</Button>
      </CardFooter>
    </Card>
  );
};
