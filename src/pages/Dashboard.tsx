
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

const Dashboard = () => {
  const {
    customerCount,
    vehicleCount,
    agreementCount,
    monthlyRevenue,
    overduePayments,
    recentAgreements,
    recentPayments,
    isLoadingCustomers,
    isLoadingVehicles,
    isLoadingAgreementsCount,
    isLoadingRevenue,
    isLoadingOverduePayments,
    isLoadingAgreements,
    isLoadingPayments,
  } = useDashboard();

  const isLoading =
    isLoadingCustomers ||
    isLoadingVehicles ||
    isLoadingAgreementsCount ||
    isLoadingRevenue ||
    isLoadingOverduePayments ||
    isLoadingAgreements ||
    isLoadingPayments;

  // Check if there's an issue with the data
  const hasDataIssue = !isLoading && 
    (customerCount === undefined || 
     vehicleCount === undefined || 
     agreementCount === undefined ||
     monthlyRevenue === undefined);

  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your car rental management system"
    >
      {hasDataIssue && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Error</AlertTitle>
          <AlertDescription>
            There was an issue retrieving your dashboard data. Some metrics may not display correctly.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <DashboardStats 
          customerCount={customerCount} 
          vehicleCount={vehicleCount}
          agreementCount={agreementCount}
          monthlyRevenue={monthlyRevenue}
          overduePayments={overduePayments}
          isLoading={isLoading}
        />
        
        <RecentActivity 
          recentAgreements={recentAgreements} 
          recentPayments={recentPayments}
          isLoadingAgreements={isLoadingAgreements}
          isLoadingPayments={isLoadingPayments}
        />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
