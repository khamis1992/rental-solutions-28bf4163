
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import FleetReport from '@/components/reports/FleetReport';
import FinancialReport from '@/components/reports/FinancialReport';
import CustomerReport from '@/components/reports/CustomerReport';
import MaintenanceReport from '@/components/reports/MaintenanceReport';
import LegalReport from '@/components/reports/LegalReport';
import TrafficFinesReport from '@/components/reports/TrafficFinesReport';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText, Download, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useAgreements } from '@/hooks/use-agreements';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('fleet');
  const { vehicles } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
  const { agreements } = useAgreements();
  const { trafficFines } = useTrafficFines();
  const [maintenanceData, setMaintenanceData] = useState([]);
  
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const data = await getAllRecords();
        setMaintenanceData(data || []);
      } catch (error) {
        console.error("Error fetching maintenance data:", error);
      }
    };
    
    fetchMaintenance();
  }, []);
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateScheduledReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Scheduled report generated successfully');
    }, 2000);
  };
  
  const getFinancialReportData = () => {
    if (!agreements) return [];
    
    try {
      const reportData = agreements.map(agreement => {
        const paymentsForAgreement = transactions ? transactions.filter(t => 
          t.lease_id === agreement.id) : [];
        
        const finesForAgreement = trafficFines ? 
          trafficFines.filter(fine => fine.leaseId === agreement.id) : [];
        
        const totalPaid = paymentsForAgreement.reduce((sum, payment) => {
          const isPaid = 
            payment.status === 'completed' || 
            payment.status === 'success' || 
            payment.status.toLowerCase() === 'paid';
          return isPaid ? sum + (payment.amount || 0) : sum;
        }, 0);
          
        const outstandingBalance = (agreement.total_amount || 0) - totalPaid;
        
        const totalFinesAmount = finesForAgreement.reduce((sum, fine) => 
          sum + (fine.fineAmount || 0), 0);
          
        const paidFinesAmount = finesForAgreement.reduce((sum, fine) => 
          fine.paymentStatus === 'paid' ? sum + (fine.fineAmount || 0) : sum, 0);
          
        const outstandingFines = totalFinesAmount - paidFinesAmount;
        
        let paymentStatus = 'Paid';
        if (outstandingBalance > 0) {
          paymentStatus = 'Partially Paid';
        } 
        if (totalPaid === 0) {
          paymentStatus = 'Unpaid';
        }
        
        const lastPayment = paymentsForAgreement.length > 0 ? 
          paymentsForAgreement.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          })[0] : null;
        
        return {
          ...agreement,
          payments: paymentsForAgreement,
          fines: finesForAgreement,
          totalPaid,
          outstandingBalance,
          totalFinesAmount,
          paidFinesAmount,
          outstandingFines,
          paymentStatus,
          lastPaymentDate: lastPayment?.date || null
        };
      });
      
      return reportData;
    } catch (error) {
      console.error('Error preparing financial report data:', error);
      return [];
    }
  };
  
  const getReportData = (): Record<string, any>[] => {
    switch (selectedTab) {
      case 'fleet':
        return vehicles.map(v => ({
          make: v.make,
          model: v.model,
          year: v.year,
          license_plate: v.license_plate,
          status: v.status,
          daily_rate: v.dailyRate
        }));
      case 'financial':
        return getFinancialReportData();
      case 'customers':
        return customers.map(customer => ({
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          driver_license: customer.driver_license,
          nationality: customer.nationality || 'N/A',
          address: customer.address || 'N/A',
          created_at: customer.created_at
        }));
      case 'maintenance':
        return maintenanceData.map(record => ({
          id: record.id,
          vehicle: record.vehicles ? `${record.vehicles.make} ${record.vehicles.model} (${record.vehicles.license_plate})` : 'Unknown Vehicle',
          maintenance_type: record.maintenance_type || 'General Maintenance',
          scheduled_date: record.scheduled_date,
          status: record.status,
          cost: record.cost || 0,
          completion_date: record.completed_date,
          service_provider: record.service_provider || record.performed_by || 'N/A',
          notes: record.notes || 'N/A'
        }));
      case 'trafficFines':
        if (!trafficFines) return [];
        const assignedFines = trafficFines.filter(fine => fine.customerId);
        return assignedFines.map(fine => ({
          customer_name: fine.customerName || 'Unknown',
          violation_number: fine.violationNumber || 'N/A',
          license_plate: fine.licensePlate || 'N/A',
          violation_date: fine.violationDate,
          amount: fine.fineAmount,
          status: fine.paymentStatus,
          violation_charge: fine.violationCharge || 'N/A',
          location: fine.location || 'N/A'
        }));
      case 'legal':
        return [];
      default:
        return [];
    }
  };

  return (
    <PageContainer 
      title="Reports & Analytics" 
      description="Comprehensive reports and analytics for your rental business"
      actions={
        <Button 
          variant="outline"
          onClick={() => navigate('/reports/scheduled')}
          className="flex items-center space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>Scheduled Reports</span>
        </Button>
      }
    >
      <div className="flex items-center mb-6">
        <SectionHeader 
          title="Generate Reports" 
          description="Select a report type to view detailed analytics and insights" 
          icon={FileText} 
        />
      </div>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          You can schedule reports to be automatically generated and sent to your email on a recurring basis.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-6 mb-8">
              <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="customers">Customer Report</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
              <TabsTrigger value="trafficFines">Traffic Fines</TabsTrigger>
              <TabsTrigger value="legal">Legal Report</TabsTrigger>
            </TabsList>
            
            <div className="mb-6">
              <ReportDownloadOptions 
                reportType={selectedTab} 
                getReportData={getReportData} 
              />
            </div>
            
            <TabsContent value="fleet" className="mt-0">
              <FleetReport />
            </TabsContent>
            
            <TabsContent value="financial" className="mt-0">
              <FinancialReport />
            </TabsContent>
            
            <TabsContent value="customers" className="mt-0">
              <CustomerReport />
            </TabsContent>
            
            <TabsContent value="maintenance" className="mt-0">
              <MaintenanceReport />
            </TabsContent>
            
            <TabsContent value="trafficFines" className="mt-0">
              <TrafficFinesReport />
            </TabsContent>
            
            <TabsContent value="legal" className="mt-0">
              <LegalReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Reports;
