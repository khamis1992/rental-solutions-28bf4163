
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
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { generateTrafficFinesReport } from '@/utils/report-utils';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('fleet');
  const { vehicles } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
  const [maintenanceData, setMaintenanceData] = useState([]);
  const { trafficFines } = useTrafficFines();

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
        return transactions;
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
        return [];
      case 'traffic-fines':
        return trafficFines?.map(fine => ({
          vehicleModel: fine.vehicleId ? `${fine.make} ${fine.model}` : 'N/A',
          licensePlate: fine.licensePlate || 'N/A',
          customerName: fine.customerName || 'N/A',
          agreementNumber: fine.leaseId || 'N/A',
          fineCount: 1,
          fineAmount: fine.fineAmount || 0,
          paymentStatus: fine.paymentStatus || 'pending'
        })) || [];
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
              <TabsTrigger value="legal">Legal Report</TabsTrigger>
              <TabsTrigger value="traffic-fines">Traffic Fines</TabsTrigger>
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
            
            <TabsContent value="traffic-fines" className="mt-0">
              <Card className="border-0 shadow-none">
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold">Traffic Fines Report</h3>
                    <p className="text-sm text-muted-foreground">
                      View and analyze all traffic fines data
                    </p>
                  </div>
                  
                  <ReportDownloadOptions
                    reportType="traffic-fines"
                    getReportData={getReportData}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Reports;
