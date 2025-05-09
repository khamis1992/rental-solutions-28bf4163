
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMaintenance } from '@/hooks/use-maintenance';
import { toast } from "sonner";
import { MaintenanceTypeStep } from './wizard/MaintenanceTypeStep';
import { MaintenanceDetailsStep } from './wizard/MaintenanceDetailsStep';
import { MaintenanceConfirmationStep } from './wizard/MaintenanceConfirmationStep';
import { useMaintenanceForm } from './wizard/useMaintenanceForm';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { create } = useMaintenance(vehicleId || '');
  
  // Use our custom hook for form state and validation
  const {
    formData,
    errors,
    handleInputChange,
    handleSelectChange,
    validateForm,
    getSubmitData
  } = useMaintenanceForm(vehicleId);

  const handleContinue = () => {
    if (currentStep === 'type') {
      // Validate only the fields in the current step
      const isValid = !errors.maintenance_type && !errors.description;
      if (isValid) {
        setCurrentStep('details');
      }
    } else if (currentStep === 'details') {
      // Validate all fields before proceeding to confirmation
      if (validateForm()) {
        setCurrentStep('confirm');
      }
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
    if (!validateForm()) {
      toast.error("Please correct the form errors before submitting");
      return;
    }

    setIsProcessing(true);
    try {
      const submitData = getSubmitData();
      await create.mutateAsync(submitData);
      toast.success("Maintenance scheduled successfully");
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error("Failed to schedule maintenance");
    } finally {
      setIsProcessing(false);
    }
  };

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
            <MaintenanceTypeStep
              maintenanceType={formData.maintenance_type}
              description={formData.description || ''}
              onMaintenanceTypeChange={(value) => handleSelectChange('maintenance_type', value)}
              onDescriptionChange={handleInputChange}
              errors={errors}
            />
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            <MaintenanceDetailsStep
              scheduledDate={formData.scheduled_date}
              estimatedCost={formData.estimated_cost}
              assignedTo={formData.assigned_to || ''}
              notes={formData.notes || ''}
              onInputChange={handleInputChange}
              errors={errors}
            />
          </TabsContent>
          
          <TabsContent value="confirm" className="pt-4">
            <MaintenanceConfirmationStep
              maintenanceType={formData.maintenance_type}
              scheduledDate={formData.scheduled_date}
              estimatedCost={formData.estimated_cost}
              assignedTo={formData.assigned_to || ''}
              description={formData.description || ''}
              notes={formData.notes || ''}
            />
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
