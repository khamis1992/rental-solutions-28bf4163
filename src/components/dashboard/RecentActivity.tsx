import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Mock data for recent activity
    const mockActivities: Activity[] = [
      {
        id: "1",
        type: "payment",
        description: "Payment of $250 received from John Doe",
        timestamp: "2023-10-26T10:00:00Z",
      },
      {
        id: "2",
        type: "agreement",
        description: "New agreement created for Vehicle XYZ123",
        timestamp: "2023-10-25T14:30:00Z",
      },
      {
        id: "3",
        type: "vehicle",
        description: "Vehicle ABC456 added to inventory",
        timestamp: "2023-10-24T09:15:00Z",
      },
      {
        id: "4",
        type: "customer",
        description: "New customer Jane Smith registered",
        timestamp: "2023-10-23T16:45:00Z",
      },
      {
        id: "5",
        type: "payment",
        description: "Payment of $300 received from Alice Johnson",
        timestamp: "2023-10-22T11:20:00Z",
      },
    ];

    setActivities(mockActivities);
  }, []);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest activities in your system</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ScrollArea className="h-[400px] w-full pr-2">
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div key={activity.id} className="py-2">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
