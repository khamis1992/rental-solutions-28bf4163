
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Car, CircleDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const FleetReport = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Vehicles" 
          value="124" 
          trend={5}
          trendLabel="vs last month"
          icon={Car}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Active Rentals" 
          value="83" 
          trend={12}
          trendLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Average Daily Rate" 
          value={formatCurrency(85)} 
          trend={3}
          trendLabel="vs last month"
          icon={CircleDollarSign}
          iconColor="text-indigo-500"
        />
        <StatCard 
          title="Maintenance Required" 
          value="7" 
          trend={-2}
          trendLabel="vs last month"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>No vehicle data available</p>
            <p className="text-sm mt-2">Vehicle data will appear here when available</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance by Vehicle Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>No performance data available</p>
            <p className="text-sm mt-2">Performance data will appear here when available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    'available': 'bg-green-100 text-green-800',
    'rented': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-amber-100 text-amber-800',
    'repair': 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
      {status}
    </Badge>
  );
};

export default FleetReport;
