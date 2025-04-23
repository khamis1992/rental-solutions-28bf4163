
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import VehicleImageUpload from './VehicleImageUpload';
import { useVehicles } from '@/hooks/use-vehicles';

interface VehicleOnboardingWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function VehicleOnboardingWizard({
  open,
  onClose,
  onComplete
}: VehicleOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    license_plate: '',
    color: '',
    insurance_company: '',
    insurance_policy: '',
    insurance_expiry: '',
    documents_verified: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { useCreate } = useVehicles();
  const { mutate: createVehicle } = useCreate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleContinue = () => {
    if (currentStep === 'basic') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('verify');
    }
  };

  const handleBack = () => {
    if (currentStep === 'verify') {
      setCurrentStep('documents');
    } else if (currentStep === 'documents') {
      setCurrentStep('basic');
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await createVehicle(formData);
      toast.success("Vehicle successfully onboarded");
      onComplete();
      onClose();
    } catch (error) {
      toast.error("Failed to onboard vehicle");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" value={formData.make} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" value={formData.model} onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" value={formData.year} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vin">VIN</Label>
          <Input id="vin" name="vin" value={formData.vin} onChange={handleInputChange} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="license_plate">License Plate</Label>
          <Input id="license_plate" name="license_plate" value={formData.license_plate} onChange={handleInputChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" value={formData.color} onChange={handleInputChange} />
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="insurance_company">Insurance Company</Label>
        <Input id="insurance_company" name="insurance_company" value={formData.insurance_company} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance_policy">Insurance Policy Number</Label>
        <Input id="insurance_policy" name="insurance_policy" value={formData.insurance_policy} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="insurance_expiry">Insurance Expiry Date</Label>
        <Input type="date" id="insurance_expiry" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} />
      </div>
      <VehicleImageUpload onUpload={(url) => console.log('Image uploaded:', url)} />
    </div>
  );

  const renderVerification = () => (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <div className="flex items-top space-x-2">
          <Checkbox 
            id="verify" 
            checked={formData.documents_verified}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, documents_verified: checked as boolean }))}
          />
          <Label htmlFor="verify" className="text-sm font-medium">
            I confirm that all vehicle information and documents have been verified
          </Label>
        </div>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Vehicle Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Make/Model:</span>
            <span>{formData.make} {formData.model}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Year:</span>
            <span>{formData.year}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">License Plate:</span>
            <span>{formData.license_plate}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-slate-500">Insurance:</span>
            <span>{formData.insurance_company} (Expires: {formData.insurance_expiry})</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vehicle Onboarding</DialogTitle>
          <DialogDescription>
            Add a new vehicle to your fleet step by step
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" disabled>Basic Info</TabsTrigger>
            <TabsTrigger value="documents" disabled>Documents</TabsTrigger>
            <TabsTrigger value="verify" disabled>Verify</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="pt-4">
            {renderBasicInfo()}
          </TabsContent>
          
          <TabsContent value="documents" className="pt-4">
            {renderDocuments()}
          </TabsContent>
          
          <TabsContent value="verify" className="pt-4">
            {renderVerification()}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className="gap-2 sm:gap-0">
          {currentStep !== 'basic' && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              Back
            </Button>
          )}
          
          {currentStep !== 'verify' ? (
            <Button onClick={handleContinue}>
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.documents_verified || isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Complete Onboarding'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
