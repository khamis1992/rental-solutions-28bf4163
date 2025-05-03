
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Reports from '@/pages/Reports';
import ScheduledReports from '@/pages/ScheduledReports';

const ReportRoutes = () => {
  return (
    <Routes>
      <Route index element={<Reports />} />
      <Route path="scheduled" element={<ScheduledReports />} />
    </Routes>
  );
};

export default ReportRoutes;
