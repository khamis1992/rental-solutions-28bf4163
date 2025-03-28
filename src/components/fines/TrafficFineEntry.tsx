import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AlertTriangle, Check, Car, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry: React.FC<TrafficFineEntryProps> = ({ onFineSaved }) => {
  const [loading, setLoading] = useState(false);
  const [fineData, setFineData] = useState({
    violationDate: new Date(),
    licensePlate: "",
    violationType: "",
    fineAmount: "",
    violationLocation: "",
    serialNumber: "",
    violationPoints: "",
    paymentStatus: "pending",
  });
  
  const violationTypes = [
    { value: "speeding", label: "Speeding" },
    { value: "parking", label: "Illegal Parking" },
    { value: "red_light", label: "Red Light Violation" },
    { value: "driving_behavior", label: "Unsafe Driving Behavior" },
    { value: "documentation", label: "Missing Documentation" },
    { value: "lane_violation", label: "Lane Violation" },
    { value: "phone_usage", label: "Phone Usage While Driving" },
    { value: "other", label: "Other" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFineData({ ...fineData, [name]: value });
  };
  
  const handleSelectChange = (field: string, value: string) => {
    setFineData({ ...fineData, [field]: value });
  };
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFineData({ ...fineData, violationDate: date });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fineData.licensePlate || !fineData.violationType || !fineData.fineAmount) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      // Validate the license plate first
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate')
        .eq('license_plate', fineData.licensePlate)
        .single();
      
      if (vehicleError) {
        // If no vehicle found, show an error
        toast.error(`No vehicle found with license plate ${fineData.licensePlate}`);
        setLoading(false);
        return;
      }
      
      // For now, just simulate saving the data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Traffic fine recorded successfully");
      
      // Reset the form
      setFineData({
        violationDate: new Date(),
        licensePlate: "",
        violationType: "",
        fineAmount: "",
        violationLocation: "",
        serialNumber: "",
        violationPoints: "",
        paymentStatus: "pending",
      });
      
      // Call the callback if provided
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error: any) {
      toast.error(`Failed to record traffic fine: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
          Record New Traffic Fine
        </CardTitle>
        <CardDescription>Enter the details of the traffic violation</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate" className="flex items-center">
                <Car className="h-4 w-4 mr-1" />
                License Plate <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="licensePlate"
                name="licensePlate"
                value={fineData.licensePlate}
                onChange={handleInputChange}
                placeholder="Enter vehicle license plate"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violationDate">
                Violation Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={fineData.violationDate}
                setDate={handleDateChange}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violationType">
                Violation Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={fineData.violationType} 
                onValueChange={(value) => handleSelectChange("violationType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select violation type" />
                </SelectTrigger>
                <SelectContent>
                  {violationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fineAmount">
                Fine Amount (QAR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fineAmount"
                name="fineAmount"
                value={fineData.fineAmount}
                onChange={handleInputChange}
                placeholder="Enter fine amount"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violationLocation">
                Violation Location
              </Label>
              <Input
                id="violationLocation"
                name="violationLocation"
                value={fineData.violationLocation}
                onChange={handleInputChange}
                placeholder="Enter location of violation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serialNumber">
                Serial Number / Reference
              </Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                value={fineData.serialNumber}
                onChange={handleInputChange}
                placeholder="Enter fine reference number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="violationPoints">
                Violation Points
              </Label>
              <Input
                id="violationPoints"
                name="violationPoints"
                value={fineData.violationPoints}
                onChange={handleInputChange}
                placeholder="Enter violation points"
                type="number"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">
                Payment Status
              </Label>
              <Select 
                value={fineData.paymentStatus} 
                onValueChange={(value) => handleSelectChange("paymentStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Record Fine
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TrafficFineEntry;
