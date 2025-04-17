
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { BarChart3, Car, Users, Coins } from 'lucide-react';  // Changed FileBarGraph to BarChart3
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancialReport } from '@/hooks/use-financial-report';
import { Vehicle } from '@/types/vehicle';
import { VehicleTypeDistribution, FleetStats } from '@/types/fleet-report';
import FinancialReport from '@/components/reports/FinancialReport';

const Reports = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modify the section that uses reportData with a check and default
  const fleetReport = useFleetReport();
  
  // Add a default report data object if reportData doesn't exist
  const reportData = fleetReport.fleetStats || {
    totalVehicles: 0,
    availableCount: 0,
    maintenanceCount: 0,
    rentedCount: 0
  };

  const financialData = useFinancialReport();
  const { vehicles = [], isLoading, error } = fleetReport;
  const vehiclesByType = fleetReport.getVehicleTypeDistribution();
  const activeRentals = fleetReport.getActiveRentals();

  let totalRevenue = 0;
  let totalExpenses = 0;

  if (financialData) {
    totalRevenue = financialData.revenue.reduce((sum, item) => sum + item.amount, 0);
    totalExpenses = financialData.expenses.reduce((sum, item) => sum + item.amount, 0);
  }

  // Calculate percentages
  const availablePercentage = ((reportData.availableCount || 0) / (reportData.totalVehicles || 1)) * 100;
  const maintenancePercentage = ((reportData.maintenanceCount || 0) / (reportData.totalVehicles || 1)) * 100;
  const rentedPercentage = ((reportData.rentedCount || 0) / (reportData.totalVehicles || 1)) * 100;

  // Handle error messages
  React.useEffect(() => {
    if (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } else {
      setErrorMessage(null);
    }
  }, [error]);

  // Clear error message after 5 seconds
  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Handle loading state
  if (isLoading) {
    return (
      <PageContainer title="Reports">
        <p>Loading...</p>
      </PageContainer>
    );
  }

  // Display error if present
  if (errorMessage) {
    return (
      <PageContainer title="Reports">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Reports">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fleet Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-4 w-4" />
              <span>Fleet Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Vehicles</span>
                <span>{reportData.totalVehicles}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Available</span>
                <span>{reportData.availableCount}</span>
              </div>
              <Progress value={availablePercentage} />
              <div className="flex items-center justify-between">
                <span>In Maintenance</span>
                <span>{reportData.maintenanceCount}</span>
              </div>
              <Progress value={maintenancePercentage} />
              <div className="flex items-center justify-between">
                <span>Rented</span>
                <span>{reportData.rentedCount}</span>
              </div>
              <Progress value={rentedPercentage} />
            </div>
          </CardContent>
        </Card>

        {/* Active Rentals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Active Rentals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Currently Rented Vehicles</span>
                <span>{activeRentals}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Vehicle Type Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehiclesByType.map((item) => (
                <div key={item.type || item.vehicleType} className="flex items-center justify-between">
                  <span>{item.type || item.vehicleType}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-4 w-4" />
              <span>Financial Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Total Revenue</span>
                <span>${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Expenses</span>
                <span>${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Net Profit</span>
                <span>${(totalRevenue - totalExpenses).toFixed(2)}</span>
              </div>
            </div>
            <FinancialReport data={{
              revenue: financialData?.revenue || [],
              expenses: financialData?.expenses || []
            }} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Reports;
