
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationHistoryItem {
  licensePlate: string;
  validationDate: Date;
  hasFine: boolean;
  validationId?: string;
}

interface ValidationHistoryProps {
  history: ValidationHistoryItem[];
}

const ValidationHistory = ({ history }: ValidationHistoryProps) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-2">Recent Validations</h4>
      <div className="border rounded-md overflow-hidden">
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">License Plate</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                  <td className="p-2">{item.licensePlate}</td>
                  <td className="p-2">{item.validationDate.toLocaleString()}</td>
                  <td className="p-2">
                    {item.hasFine ? (
                      <span className="flex items-center text-destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Fine found
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        No fine
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ValidationHistory;
