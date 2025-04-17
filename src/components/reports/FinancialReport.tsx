
import React from 'react';

export interface FinancialReportProps {
  data: any;
}

const FinancialReport: React.FC<FinancialReportProps> = ({ data }) => {
  return (
    <div>
      <h3>Financial Report</h3>
      <p>Data visualization will be displayed here</p>
    </div>
  );
};

export default FinancialReport;
