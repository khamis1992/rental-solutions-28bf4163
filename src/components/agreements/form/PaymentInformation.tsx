
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PaymentInformationProps {
  rentAmount: string;
  setRentAmount: (value: string) => void;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  dailyLateFee: string;
  setDailyLateFee: (value: string) => void;
  totalContractAmount: string;
  setTotalContractAmount: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}

export const PaymentInformation: React.FC<PaymentInformationProps> = ({
  rentAmount,
  setRentAmount,
  depositAmount,
  setDepositAmount,
  dailyLateFee,
  setDailyLateFee,
  totalContractAmount,
  setTotalContractAmount,
  notes,
  setNotes
}) => {
  return (
    <div className="mt-8 space-y-4">
      <h3 className="font-medium text-lg">Payment Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="rentAmount" className="text-sm font-medium">
            Monthly Rent Amount
          </label>
          <Input
            id="rentAmount"
            type="number"
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="depositAmount" className="text-sm font-medium">
            Deposit Amount
          </label>
          <Input
            id="depositAmount"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="dailyLateFee" className="text-sm font-medium">
            Daily Late Fee
          </label>
          <Input
            id="dailyLateFee"
            type="number"
            value={dailyLateFee}
            onChange={(e) => setDailyLateFee(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="totalContractAmount" className="text-sm font-medium">
          Total Contract Amount
        </label>
        <Input
          id="totalContractAmount"
          type="number"
          value={totalContractAmount}
          onChange={(e) => setTotalContractAmount(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full"
          placeholder="Add any additional notes here..."
        />
      </div>
    </div>
  );
};
