
import React from 'react';

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
  notes?: string;
}

export const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({ 
  details,
  notes
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((detail, index) => (
          <DetailItem key={index} label={detail.label} value={detail.value} />
        ))}
      </div>

      {notes && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Notes</p>
          <p className="text-base whitespace-pre-line">{notes}</p>
        </div>
      )}
    </>
  );
};
