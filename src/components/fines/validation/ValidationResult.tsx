
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Fine {
  id: string;
  violation_number: string;
  violation_date: Date;
  amount: number;
  status: string;
}

interface ValidationResultProps {
  result: {
    fines_found: number;
    total_amount: number;
    pending_amount: number;
    fines: Fine[];
  };
  licensePlate: string;
}

const ValidationResult = ({ result, licensePlate }: ValidationResultProps) => {
  if (!result) return null;

  return (
    <Alert 
      variant={result.fines_found > 0 ? "destructive" : "default"}
      className="mt-6"
    >
      {result.fines_found > 0 ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <AlertTitle>Validation Results</AlertTitle>
      <AlertDescription>
        {result.fines_found > 0 ? (
          <div className="space-y-2">
            <p>
              Found {result.fines_found} traffic {result.fines_found > 1 ? 'fines' : 'fine'} for license plate {licensePlate}
            </p>
            <p>
              Total amount: QAR {result.total_amount}
            </p>
            <p>
              Pending amount: QAR {result.pending_amount}
            </p>
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Fine Details</h4>
              <div className="space-y-2">
                {result.fines.map((fine, index) => (
                  <div key={index} className="border p-2 rounded-md text-sm">
                    <div className="flex justify-between">
                      <span>Violation #{fine.violation_number || index+1}</span>
                      <span className={fine.status === 'paid' ? 'text-green-500' : 'text-red-500'}>
                        {fine.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date: {fine.violation_date.toLocaleDateString()}</span>
                      <span>Amount: QAR {fine.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>No traffic fines found for license plate {licensePlate}</p>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ValidationResult;
