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
import TrafficFineReport from '@/components/reports/TrafficFineReport';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText, Download, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('fleet');
  const { vehicles, reportData } = useFleetReport();
  const { transactions } = useFinancials();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
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
  
  useEffect(() => {
    if (trafficFines) {
      console.log("Traffic fines data loaded in Reports:", trafficFines.length);
    }
  }, [trafficFines]);
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateScheduledReport = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Scheduled report generated successfully');
    }, 2000);
  };
  
  const getReportData = () => {
    console.log("Getting report data for:", selectedTab);
    switch (selectedTab) {
      case 'fleet':
        return reportData || [];
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
      case 'traffic':
        console.log("Getting traffic fines data for report:", {
          available: Array.isArray(trafficFines),
          count: trafficFines?.length || 0,
          sample: trafficFines?.slice(0, 3) || []
        });
        
        if (Array.isArray(trafficFines)) {
          return trafficFines.map(fine => {
            let violationDate;
            try {
              violationDate = fine.violationDate instanceof Date 
                ? fine.violationDate 
                : new Date(fine.violationDate);
              
              if (isNaN(violationDate.getTime())) {
                violationDate = null;
              }
            } catch (err) {
              console.error("Invalid date format:", fine.violationDate);
              violationDate = null;
            }
            
            return {
              violationNumber: fine.violationNumber || 'N/A',
              licensePlate: fine.licensePlate || 'N/A',
              violationDate: violationDate,
              fineAmount: typeof fine.fineAmount === 'number' ? fine.fineAmount : 0,
              customerName: fine.customerName || 'Unassigned'
            };
          });
        }
        return [];
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
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-6 mb-8 space-x-2">
              <TabsTrigger value="fleet">Fleet Report</TabsTrigger>
              <TabsTrigger value="financial">Financial Report</TabsTrigger>
              <TabsTrigger value="customers">Customer Report</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Fines</TabsTrigger>
              <TabsTrigger value="legal">Legal Report</TabsTrigger>
            </TabsList>
            
            <div className="mb-6 px-4">
              <ReportDownloadOptions 
                reportType={selectedTab} 
                getReportData={getReportData} 
              />
            </div>
            
            <div className="space-y-4">
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
              
              <TabsContent value="traffic" className="mt-0">
                <TrafficFineReport />
              </TabsContent>
              
              <TabsContent value="legal" className="mt-0">
                <LegalReport />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Reports;
