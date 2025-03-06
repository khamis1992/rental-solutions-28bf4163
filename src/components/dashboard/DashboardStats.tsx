
import React from 'react';
import { Car, DollarSign, Users, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 section-transition">
      <StatCard
        title="Total Vehicles"
        value="124"
        description="Fleet inventory"
        icon={Car}
        iconColor="text-blue-500"
        trend={5.2}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Revenue"
        value="$48,265"
        description="This month"
        icon={DollarSign}
        iconColor="text-green-500"
        trend={12.3}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Active Customers"
        value="832"
        description="Current rentals: 67"
        icon={Users}
        iconColor="text-violet-500"
        trend={3.7}
        trendLabel="vs last month"
      />
      
      <StatCard
        title="Contracts"
        value="92"
        description="Active agreements"
        icon={FileText}
        iconColor="text-amber-500"
        trend={-2.5}
        trendLabel="vs last month"
      />
    </div>
  );
};

export default DashboardStats;
