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
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useAgreements } from '@/hooks/use-agreements';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Prepare financial report data with payments and fines
  const getFinancialReportData = async () => {
    if (!agreements) return [];
    
    try {
      // Create a map to store payment info by agreement ID
      const paymentsMap = {};
      
      // Fetch all payments for these agreements
      const { data: allPayments } = await supabase
        .from('unified_payments')
        .select('*');
        
      if (allPayments) {
        // Group payments by lease_id
        allPayments.forEach(payment => {
          if (payment.lease_id) {
            if (!paymentsMap[payment.lease_id]) {
              paymentsMap[payment.lease_id] = [];
            }
            paymentsMap[payment.lease_id].push(payment);
          }
        });
      }
      
      // Map traffic fines by agreement ID
      const finesMap = {};
      if (trafficFines) {
        trafficFines.forEach(fine => {
          if (fine.leaseId) {
            if (!finesMap[fine.leaseId]) {
              finesMap[fine.leaseId] = [];
            }
            finesMap[fine.leaseId].push(fine);
          }
        });
      }
      
      // Process agreement data with payments and fines
      return agreements.map(agreement => {
        const payments = paymentsMap[agreement.id] || [];
        const fines = finesMap[agreement.id] || [];
        
        const totalPaid = payments.reduce((sum, payment) => 
          payment.status === 'paid' ? sum + (payment.amount_paid || 0) : sum, 0);
          
        const outstandingBalance = (agreement.total_amount || 0) - totalPaid;
        
        const totalFinesAmount = fines.reduce((sum, fine) => 
          sum + (fine.fineAmount || 0), 0);
          
        const paidFinesAmount = fines.reduce((sum, fine) => 
          fine.paymentStatus === 'paid' ? sum + (fine.fineAmount || 0) : sum, 0);
          
        const outstandingFines = totalFinesAmount - paidFinesAmount;
        
        // Determine overall payment status
        let paymentStatus = 'Paid';
        if (outstandingBalance > 0) {
          paymentStatus = 'Partially Paid';
        } 
        if (totalPaid === 0) {
          paymentStatus = 'Unpaid';
        }
        
        // Get most recent payment date
        const lastPayment = payments.length > 0 ? 
          payments.sort((a, b) => 
            new Date(b.payment_date || '1970-01-01').getTime() - 
            new Date(a.payment_date || '1970-01-01').getTime()
          )[0] : null;
        
        return {
          ...agreement,
          payments,
          fines,
          totalPaid,
          outstandingBalance,
          totalFinesAmount,
          paidFinesAmount,
          outstandingFines,
          paymentStatus,
          lastPaymentDate: lastPayment?.payment_date || null
        };
      });
    } catch (error) {
      console.error('Error preparing financial report data:', error);
      return [];
    }
  };
  
  // Modified to handle async data synchronously for reports
  const getReportData = () => {
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
        // Return cached data to avoid async issues with download
        const prepareFinancialData = () => {
          if (!agreements) return [];
          
          return agreements.map(agreement => {
            // Get related payments for this agreement
            const paymentsForAgreement = transactions.filter(t => 
              t.agreement_number === agreement.agreement_number);
            
            // Get related fines for this agreement
            const finesForAgreement = trafficFines ? 
              trafficFines.filter(fine => fine.leaseId === agreement.id) : [];
            
            // Calculate totals
            const totalPaid = paymentsForAgreement.reduce((sum, payment) => 
              payment.status === 'paid' ? sum + (payment.amount || 0) : sum, 0);
              
            const outstandingBalance = (agreement.total_amount || 0) - totalPaid;
            
            const totalFinesAmount = finesForAgreement.reduce((sum, fine) => 
              sum + (fine.fineAmount || 0), 0);
              
            const paidFinesAmount = finesForAgreement.reduce((sum, fine) => 
              fine.paymentStatus === 'paid' ? sum + (fine.fineAmount || 0) : sum, 0);
              
            // Payment status determination
            let paymentStatus = 'Paid';
            if (outstandingBalance > 0) {
              paymentStatus = 'Partially Paid';
            }
            if (totalPaid === 0) {
              paymentStatus = 'Unpaid';
            }
            
            return {
              ...agreement,
              customer_name: agreement.customers?.full_name || 'N/A',
              payments: paymentsForAgreement,
              fines: finesForAgreement,
              totalPaid,
              outstandingBalance,
              totalFinesAmount,
              paidFinesAmount,
              paymentStatus
            };
          });
        };
        
        return prepareFinancialData();
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
      case 'legal':
        // Legal reports data would be implemented here
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
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="customers">Customer Report</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
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
