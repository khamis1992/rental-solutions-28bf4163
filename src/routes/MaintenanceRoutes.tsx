
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Maintenance from '@/pages/Maintenance';
import AddMaintenance from '@/pages/AddMaintenance';
import MaintenanceDetailPage from '@/pages/MaintenanceDetailPage';
import EditMaintenance from '@/pages/EditMaintenance';

const MaintenanceRoutes = () => {
  return (
    <Routes>
      <Route index element={<Maintenance />} />
      <Route path="add" element={<AddMaintenance />} />
      <Route path=":id" element={<MaintenanceDetailPage />} />
      <Route path="edit/:id" element={<EditMaintenance />} />
    </Routes>
  );
};

export default MaintenanceRoutes;
