
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RevenueChart from '@/components/dashboard/RevenueChart';
import VehicleStatusChart from '@/components/dashboard/VehicleStatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';

const Dashboard = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Dashboard"
        description="Overview of your rental operations"
        icon={LayoutDashboard}
        actions={
          <CustomButton size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </CustomButton>
        }
      />
      
      <div className="space-y-6">
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 section-transition">
          <RevenueChart />
          <VehicleStatusChart />
        </div>
        
        <RecentActivity />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
