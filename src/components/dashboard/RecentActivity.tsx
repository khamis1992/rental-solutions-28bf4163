
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, User, CreditCard, Wrench, AlertTriangle } from 'lucide-react';

type ActivityType = 'rental' | 'return' | 'payment' | 'maintenance' | 'fine';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'rental',
    title: 'New Rental',
    description: 'John Doe rented Toyota Camry (ABC-123)',
    time: '12 minutes ago',
  },
  {
    id: '2',
    type: 'return',
    title: 'Vehicle Return',
    description: 'BMW X5 (XYZ-789) returned by Sarah Johnson',
    time: '45 minutes ago',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    description: '$650.00 received for Invoice #INV-2023-089',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'maintenance',
    title: 'Maintenance Scheduled',
    description: 'Honda Civic (DEF-456) scheduled for oil change',
    time: '2 hours ago',
  },
  {
    id: '5',
    type: 'fine',
    title: 'Traffic Fine Recorded',
    description: 'Speeding ticket for Audi A4 (GHI-789)',
    time: '3 hours ago',
  },
];

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'rental':
    case 'return':
      return <Car className="h-5 w-5" />;
    case 'payment':
      return <CreditCard className="h-5 w-5" />;
    case 'maintenance':
      return <Wrench className="h-5 w-5" />;
    case 'fine':
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case 'rental':
      return 'bg-blue-100 text-blue-700';
    case 'return':
      return 'bg-green-100 text-green-700';
    case 'payment':
      return 'bg-violet-100 text-violet-700';
    case 'maintenance':
      return 'bg-amber-100 text-amber-700';
    case 'fine':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const RecentActivity = () => {
  return (
    <Card className="col-span-4 card-transition">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)} mr-4`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-muted-foreground mt-1">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
