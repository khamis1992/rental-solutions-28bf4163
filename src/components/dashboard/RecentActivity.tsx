
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Car, User, CreditCard, Wrench, AlertTriangle, Clock, Filter } from 'lucide-react';
import { RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string | null>(null);

  const handleActivityClick = (activity: RecentActivityType) => {
    // Navigate to the relevant page based on activity type
    if (activity.type === 'rental' || activity.type === 'return') {
      navigate(`/agreements/${activity.id}`);
    } else if (activity.type === 'payment') {
      navigate(`/financials`);
    } else if (activity.type === 'maintenance') {
      navigate(`/maintenance/${activity.id}`);
    } else if (activity.type === 'fine') {
      navigate(`/fines`);
    }
  };

  // Apply filter to activities if filter is set
  const filteredActivities = filter 
    ? activities.filter(activity => activity.type === filter)
    : activities;

  return (
    <Card className="col-span-4 card-transition dashboard-card">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          {filter && (
            <Badge 
              variant="outline" 
              className="mt-1"
              onClick={() => setFilter(null)}
            >
              Filtered by: {filter} × 
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilter(null)}>
              All activities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('rental')}>
              <Car className="h-3.5 w-3.5 mr-2" />
              Rentals
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('payment')}>
              <CreditCard className="h-3.5 w-3.5 mr-2" />
              Payments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('maintenance')}>
              <Wrench className="h-3.5 w-3.5 mr-2" />
              Maintenance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('fine')}>
              <AlertTriangle className="h-3.5 w-3.5 mr-2" />
              Fines
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {filter ? `No ${filter} activity to display` : "No recent activity to display"}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} mr-4`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{activity.title}</h4>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-muted-foreground mt-1">{activity.description}</p>
                  <div className="mt-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary"
                    >
                      View details →
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => navigate('/activity')}>
          View All Activity
        </Button>
      </CardFooter>
    </Card>
  );
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'rental':
      return <Car className="h-5 w-5" />;
    case 'return':
      return <Clock className="h-5 w-5" />;
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

const getActivityColor = (type: string) => {
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

export default RecentActivity;
