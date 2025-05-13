
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface AgreementTermsEditorProps {
  termsAccepted: boolean;
  onTermsAcceptedChange: (accepted: boolean) => void;
  additionalDrivers: string[];
  onAdditionalDriversChange: (drivers: string[]) => void;
}

const AgreementTermsEditor: React.FC<AgreementTermsEditorProps> = ({
  termsAccepted,
  onTermsAcceptedChange,
  additionalDrivers,
  onAdditionalDriversChange,
}) => {
  const [newDriver, setNewDriver] = React.useState('');

  const handleAddDriver = () => {
    if (!newDriver.trim()) return;
    
    onAdditionalDriversChange([...additionalDrivers, newDriver.trim()]);
    setNewDriver('');
  };

  const handleRemoveDriver = (index: number) => {
    const newDrivers = [...additionalDrivers];
    newDrivers.splice(index, 1);
    onAdditionalDriversChange(newDrivers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => onTermsAcceptedChange(!!checked)} 
              />
              <Label htmlFor="terms">
                I confirm that the renter has accepted the terms and conditions of this agreement
              </Label>
            </div>
            
            <div className="mt-8">
              <Label className="text-lg font-medium mb-4 block">Additional Drivers</Label>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter driver name"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDriver();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddDriver}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                {additionalDrivers.length > 0 ? (
                  <ul className="space-y-2">
                    {additionalDrivers.map((driver, index) => (
                      <li 
                        key={index} 
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <span>{driver}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDriver(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No additional drivers added</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementTermsEditor;
