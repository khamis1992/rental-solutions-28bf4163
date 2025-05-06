
import React from 'react';
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

interface AgreementDetailsProps {
  agreementNumber: string;
  setAgreementNumber: (value: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  durationMonths: string;
  setDurationMonths: (value: string) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  status: string;
  setStatus: (value: string) => void;
  standardTemplateExists: boolean;
}

export const AgreementDetails: React.FC<AgreementDetailsProps> = ({
  agreementNumber,
  setAgreementNumber,
  startDate,
  setStartDate,
  durationMonths,
  setDurationMonths,
  endDate,
  setEndDate,
  status,
  setStatus,
  standardTemplateExists
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Agreement Details</h3>
      
      {/* Using Standard Template Section */}
      {standardTemplateExists && (
        <div className="mb-6 bg-green-50 p-4 rounded-md border border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-800">Using Standard Template</p>
              <p className="text-sm text-green-700">The agreement will use the standard template from the database.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="agreementNumber" className="text-sm font-medium">
          Agreement Number
        </label>
        <Input
          id="agreementNumber"
          value={agreementNumber}
          onChange={(e) => setAgreementNumber(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium">
          Start Date
        </label>
        <DatePicker 
          date={startDate} 
          setDate={setStartDate} 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="duration" className="text-sm font-medium">
          Duration (Months)
        </label>
        <Select value={durationMonths} onValueChange={setDurationMonths}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 month</SelectItem>
            <SelectItem value="3">3 months</SelectItem>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
            <SelectItem value="24">24 months</SelectItem>
            <SelectItem value="36">36 months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="endDate" className="text-sm font-medium">
          End Date
        </label>
        <DatePicker 
          date={endDate}
          setDate={setEndDate}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
