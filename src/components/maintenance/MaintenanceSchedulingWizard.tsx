
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { MaintenanceType, MaintenanceStatus } from '@/lib/validation-schemas/maintenance';
import { useMaintenance } from '@/hooks/use-maintenance';
import { toast } from "sonner";

interface MaintenanceSchedulingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  vehicleId?: string;
}

export function MaintenanceSchedulingWizard({
  open,
  onClose,
  onComplete,
  vehicleId
}: MaintenanceSchedulingWizardProps) {
  const [currentStep, setCurrentStep] = useState('type');
  const [formData, setFormData] = useState({
    vehicle_id: vehicleId || '',
    maintenance_type: MaintenanceType.REGULAR_INSPECTION,
    description: '',
    scheduled_date: '',
    estimated_cost: '',
    notes: '',
    assigned_to: '',
    status: MaintenanceStatus.SCHEDULED
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { create } = useMaintenance();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleContinue = () => {
    if (currentStep === 'type') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('type');
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await create.mutateAsync(formData);
      toast.success("Maintenance scheduled successfully");
      onComplete();
      onClose();
    } catch (error) {
      toast.error("Failed to schedule maintenance");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Maintenance Type</Label>
        <Select
          value={formData.maintenance_type}
          onValueChange={(value) => handleSelectChange('maintenance_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select maintenance type" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MaintenanceType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe the maintenance work needed"
        />
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="scheduled_date">Scheduled Date</Label>
        <Input
          type="datetime-local"
          id="scheduled_date"
          name="scheduled_date"
          value={formData.scheduled_date}
          onChange={handleInputChange}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="estimated_cost">Estimated Cost</Label>
        <Input
          type="number"
          id="estimated_cost"
          name="estimated_cost"
          value={formData.estimated_cost}
          onChange={handleInputChange}
          placeholder="0.00"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="assigned_to">Assigned To</Label>
        <Input
          id="assigned_to"
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleInputChange}
          placeholder="Technician name or ID"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Any additional notes or instructions"
        />
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Maintenance Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Type:</span>
            <span>{formData.maintenance_type.replace(/_/g, ' ')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Scheduled Date:</span>
            <span>{new Date(formData.scheduled_date).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Estimated Cost:</span>
            <span>${parseFloat(formData.estimated_cost || '0').toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Assigned To:</span>
            <span>{formData.assigned_to || 'Not assigned'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Schedule and plan maintenance work step by step
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="type" disabled>Type</TabsTrigger>
            <TabsTrigger value="details" disabled>Details</TabsTrigger>
            <TabsTrigger value="confirm" disabled>Confirm</TabsTrigger>
          </TabsList>
          
          <TabsContent value="type" className="pt-4">
            {renderTypeSelection()}
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            {renderDetails()}
          </TabsContent>
          
          <TabsContent value="confirm" className="pt-4">
            {renderConfirmation()}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className="gap-2 sm:gap-0">
          {currentStep !== 'type' && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              Back
            </Button>
          )}
          
          {currentStep !== 'confirm' ? (
            <Button onClick={handleContinue}>
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Schedule Maintenance'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
