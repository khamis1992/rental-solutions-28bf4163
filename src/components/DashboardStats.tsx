import React, { useMemo, Suspense } from 'react';
// ...existing code...

// LazyLoad complex chart components
const RevenueChart = React.lazy(() => import('./RevenueChart'));
const VehicleUtilizationChart = React.lazy(() => import('./VehicleUtilizationChart'));

export function DashboardStats({ data }) {
  // Memoize expensive calculations
  const summaryStats = useMemo(() => {
    return {
      totalRevenue: data.payments.reduce((sum, payment) => sum + payment.amount, 0),
      activeAgreements: data.agreements.filter(a => a.status === 'active').length,
      availableVehicles: data.vehicles.filter(v => v.availability_status === 'available').length,
      overduePayments: data.payments.filter(p => p.status === 'overdue').length
    };
  }, [data]);

  return (
    <div className="dashboard-container">
      {/* Static KPI Cards - These load immediately */}
      <div className="kpi-cards">
        <StatCard 
          title="Total Revenue" 
          value={`$${summaryStats.totalRevenue.toLocaleString()}`} 
        />
        <StatCard 
          title="Active Agreements" 
          value={summaryStats.activeAgreements} 
        />
        <StatCard 
          title="Available Vehicles" 
          value={summaryStats.availableVehicles} 
        />
        <StatCard 
          title="Overdue Payments" 
          value={summaryStats.overduePayments} 
        />
      </div>
      
      {/* Complex charts - These load after initial render */}
      <div className="dashboard-charts">
        <Suspense fallback={<div className="chart-placeholder">Loading revenue data...</div>}>
          <RevenueChart data={data.revenueTimeline} />
        </Suspense>
        
        <Suspense fallback={<div className="chart-placeholder">Loading utilization data...</div>}>
          <VehicleUtilizationChart data={data.vehicles} />
        </Suspense>
      </div>
    </div>
  );
}

// Extracted to a separate component for better reusability and memoization
const StatCard = React.memo(({ title, value }) => (
  <div className="stat-card">
    <h3>{title}</h3>
    <p className="stat-value">{value}</p>
  </div>
));

// ...existing code...