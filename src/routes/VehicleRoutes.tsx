
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Vehicles from '@/pages/Vehicles';
import AddVehicle from '@/pages/AddVehicle';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import EditVehicle from '@/pages/EditVehicle';

const VehicleRoutes = () => {
  return (
    <Routes>
      <Route index element={<Vehicles />} />
      <Route path="add" element={<AddVehicle />} />
      <Route path=":id" element={<VehicleDetailPage />} />
      <Route path="edit/:id" element={<EditVehicle />} />
    </Routes>
  );
};

export default VehicleRoutes;
