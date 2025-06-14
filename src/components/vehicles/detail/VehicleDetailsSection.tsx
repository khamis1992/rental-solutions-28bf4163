import React, { useState } from 'react';

interface DetailItemProps {
  label: string;
  value: string | number | React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base">{value}</p>
  </div>
);

interface VehicleDetailsSectionProps {
  details: {
    label: string;
    value: string | number | React.ReactNode;
  }[];
  inspection_expiry?: string;
  onEditInspectionExpiry?: (date: string) => void;
}

export const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({ 
  details,
  inspection_expiry,
  onEditInspectionExpiry
}) => {
  const [editing, setEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(inspection_expiry);

  const handleSave = () => {
    if (selectedDate && onEditInspectionExpiry) {
      onEditInspectionExpiry(selectedDate);
      setEditing(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((detail, index) => {
          if (detail.label === 'Inspection Expiry') {
            return (
              <div key={index} className="flex items-center gap-2">
                <DetailItem label={detail.label} value={
                  editing ? (
                    <>
                      <input
                        type="date"
                        value={selectedDate ? selectedDate.substring(0, 10) : ''}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                      <button className="ml-2 text-blue-600" onClick={handleSave}>Save</button>
                      <button className="ml-1 text-gray-500" onClick={() => setEditing(false)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {detail.value}
                      <button className="ml-2 text-blue-600 underline text-xs" onClick={() => setEditing(true)}>
                        Edit
                      </button>
                    </>
                  )
                } />
              </div>
            );
          }
          return <DetailItem key={index} label={detail.label} value={detail.value} />;
        })}
      </div>
    </>
  );
};
