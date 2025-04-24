
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface LateFeeSectionProps {
  lateFeeDetails: {
    amount: number;
    daysLate: number;
  };
  includeLatePaymentFee: boolean;
  onLatePaymentFeeChange: (checked: boolean) => void;
}

export const LateFeeSection: React.FC<LateFeeSectionProps> = ({
  lateFeeDetails,
  includeLatePaymentFee,
  onLatePaymentFeeChange,
}) => {
  return (
    <div className="border p-3 rounded-md bg-amber-50">
      <div className="flex items-start space-x-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-800">Late Payment Fee</h4>
          <p className="text-xs text-amber-700 mt-1">
            {lateFeeDetails.daysLate} days late: QAR {lateFeeDetails.amount.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="late-fee"
            checked={includeLatePaymentFee}
            onCheckedChange={onLatePaymentFeeChange}
          />
          <Label htmlFor="late-fee" className="text-xs">Include Fee</Label>
        </div>
      </div>
    </div>
  );
};
