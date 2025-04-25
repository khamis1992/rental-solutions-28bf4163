
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/custom-button';
import { 
  Wrench, 
  CalendarDays, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Truck
} from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { format } from 'date-fns';
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import VehicleSelector from './VehicleSelector';
import MaintenanceTypeSelector from './MaintenanceTypeSelector';
import MaintenanceScheduler from './MaintenanceScheduler';
import MaintenanceCostDetails from './MaintenanceCostDetails';
import MaintenanceNotes from './MaintenanceNotes';
import MaintenanceSummary from './MaintenanceSummary';

interface MaintenanceWizardProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const MaintenanceWizard: React.FC<MaintenanceWizardProps> = ({ onSubmit, isLoading }) => {
  const [activeTab, setActiveTab] = useState('vehicle');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    maintenance_type: MaintenanceType.REGULAR_INSPECTION as keyof typeof MaintenanceType,
    status: MaintenanceStatus.SCHEDULED,
    scheduled_date: new Date(),
    completion_date: undefined as Date | undefined,
    description: '',
    cost: 0,
    service_provider: '',
    invoice_number: '',
    odometer_reading: 0,
    notes: ''
  });
  
  const { data: vehicles } = useVehicles().useList();
  const selectedVehicle = vehicles?.find(v => v.id === formData.vehicle_id);

  const handleTabChange = (tab: string) => {
    // Validate before allowing to proceed
    if (tab === 'type' && !formData.vehicle_id) {
      return; // Don't proceed if no vehicle is selected
    }
    
    if (tab === 'schedule' && !formData.maintenance_type) {
      return; // Don't proceed if no maintenance type is selected
    }
    
    setActiveTab(tab);
  };
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleNext = () => {
    const tabs = ['vehicle', 'type', 'schedule', 'cost', 'notes', 'summary'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1]);
    }
  };
  
  const handleBack = () => {
    const tabs = ['vehicle', 'type', 'schedule', 'cost', 'notes', 'summary'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  const handleSubmit = () => {
    onSubmit(formData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6 relative">
        <div className="w-full bg-slate-200 h-2 absolute">
          <div 
            className="bg-primary h-2 transition-all"
            style={{
              width: activeTab === 'vehicle' ? '16.66%' :
                     activeTab === 'type' ? '33.33%' :
                     activeTab === 'schedule' ? '50%' :
                     activeTab === 'cost' ? '66.66%' :
                     activeTab === 'notes' ? '83.33%' :
                     '100%'
            }}
          />
        </div>
        <div className="flex justify-between w-full relative z-10">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'vehicle' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <Truck className="h-5 w-5" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'type' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <Wrench className="h-5 w-5" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'schedule' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'cost' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <DollarSign className="h-5 w-5" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'notes' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <FileText className="h-5 w-5" />
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center
            ${activeTab === 'summary' ? 'bg-primary text-white' : 'bg-primary/20'}`}>
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsContent value="vehicle" className="mt-0">
          <div className="text-lg font-semibold mb-4">Select Vehicle</div>
          <VehicleSelector
            vehicles={vehicles || []}
            selectedVehicleId={formData.vehicle_id}
            onChange={id => updateFormData('vehicle_id', id)}
          />
        </TabsContent>
        
        <TabsContent value="type" className="mt-0">
          <div className="text-lg font-semibold mb-4">
            Maintenance Type for {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Vehicle'}
          </div>
          <MaintenanceTypeSelector 
            selectedType={formData.maintenance_type}
            onChange={type => updateFormData('maintenance_type', type)}
          />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-0">
          <div className="text-lg font-semibold mb-4">Schedule Maintenance</div>
          <MaintenanceScheduler
            scheduledDate={formData.scheduled_date}
            completionDate={formData.completion_date}
            status={formData.status}
            onScheduledDateChange={date => updateFormData('scheduled_date', date)}
            onCompletionDateChange={date => updateFormData('completion_date', date)}
            onStatusChange={status => updateFormData('status', status)}
          />
        </TabsContent>
        
        <TabsContent value="cost" className="mt-0">
          <div className="text-lg font-semibold mb-4">Cost Details</div>
          <MaintenanceCostDetails
            cost={formData.cost}
            serviceProvider={formData.service_provider}
            invoiceNumber={formData.invoice_number}
            odometerReading={formData.odometer_reading}
            onCostChange={cost => updateFormData('cost', cost)}
            onServiceProviderChange={provider => updateFormData('service_provider', provider)}
            onInvoiceNumberChange={invoice => updateFormData('invoice_number', invoice)}
            onOdometerReadingChange={reading => updateFormData('odometer_reading', reading)}
          />
        </TabsContent>
        
        <TabsContent value="notes" className="mt-0">
          <div className="text-lg font-semibold mb-4">Additional Information</div>
          <MaintenanceNotes
            description={formData.description}
            notes={formData.notes}
            onDescriptionChange={desc => updateFormData('description', desc)}
            onNotesChange={notes => updateFormData('notes', notes)}
          />
        </TabsContent>
        
        <TabsContent value="summary" className="mt-0">
          <div className="text-lg font-semibold mb-4">Review and Submit</div>
          <MaintenanceSummary
            data={formData}
            vehicle={selectedVehicle}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={activeTab === 'vehicle' || isLoading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        {activeTab !== 'summary' ? (
          <Button 
            onClick={handleNext} 
            className="flex items-center gap-2"
            disabled={
              (activeTab === 'vehicle' && !formData.vehicle_id) ||
              (activeTab === 'type' && !formData.maintenance_type) ||
              isLoading
            }
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <CustomButton 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? 'Submitting...' : 'Submit Maintenance Record'}
          </CustomButton>
        )}
      </div>
    </div>
  );
};

export default MaintenanceWizard;
