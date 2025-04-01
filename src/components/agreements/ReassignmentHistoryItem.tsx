
import React from 'react';
import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export interface ReassignmentRecord {
  id: string;
  sourceAgreementId: string;
  sourceAgreementNumber: string;
  targetAgreementId: string;
  targetAgreementNumber: string;
  vehicleId: string;
  vehicleInfo?: {
    make?: string;
    model?: string;
    licensePlate: string;
  };
  reassignedAt: Date;
  reassignedBy?: string;
  reason?: string;
}

interface ReassignmentHistoryItemProps {
  record: ReassignmentRecord;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ReassignmentHistoryItem: React.FC<ReassignmentHistoryItemProps> = ({
  record,
  isExpanded = false,
  onToggleExpand
}) => {
  const formattedDate = format(new Date(record.reassignedAt), 'MMM d, yyyy • h:mm a');
  
  return (
    <div className="border rounded-md p-3 mb-3 hover:bg-slate-50">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Badge className="bg-blue-500">Reassignment</Badge>
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {formattedDate}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm font-medium">
            <span>Agreement #{record.sourceAgreementNumber}</span>
            <ArrowRight className="h-3 w-3 text-gray-400" />
            <span>Agreement #{record.targetAgreementNumber}</span>
          </div>
          
          <div className="text-sm mt-1">
            {record.vehicleInfo ? (
              <>
                <span className="text-gray-600">Vehicle: </span>
                <span>{record.vehicleInfo.make} {record.vehicleInfo.model} ({record.vehicleInfo.licensePlate})</span>
              </>
            ) : (
              <span className="text-gray-600">Vehicle ID: {record.vehicleId}</span>
            )}
          </div>
        </div>
        
        <div>
          {onToggleExpand && (
            <button 
              onClick={onToggleExpand} 
              className="text-xs text-blue-600 hover:underline"
            >
              {isExpanded ? 'Less details' : 'More details'}
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && record.reason && (
        <div className="mt-3 text-sm bg-slate-50 p-2 rounded border">
          <span className="font-medium">Reason: </span>
          <span className="text-gray-700">{record.reason}</span>
        </div>
      )}
    </div>
  );
};
