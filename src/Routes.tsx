import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import VehiclesPage from '@/pages/Vehicles';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import AddVehicle from '@/pages/AddVehicle';
import EditVehicle from '@/pages/EditVehicle';
import Customers from '@/pages/Customers';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import AddCustomer from '@/pages/AddCustomer';
import EditCustomer from '@/pages/EditCustomer';
import Agreements from '@/pages/Agreements';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import AddAgreement from '@/pages/AddAgreement';
import EditAgreement from '@/pages/EditAgreement';
import Maintenance from '@/pages/Maintenance';
import AddMaintenance from '@/pages/AddMaintenance';
import MaintenanceDetailPage from '@/pages/MaintenanceDetailPage';
import EditMaintenance from '@/pages/EditMaintenance';
import Financials from '@/pages/Financials';
import TrafficFines from '@/pages/TrafficFines';
import Legal from '@/pages/Legal';
import Reports from '@/pages/Reports';
import ScheduledReports from '@/pages/ScheduledReports';
import SystemSettings from '@/pages/SystemSettings';
import UserManagement from '@/pages/UserManagement';
import UserSettings from '@/pages/UserSettings';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Vehicle Routes */}
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/add" element={<AddVehicle />} />
        <Route path="/vehicles/edit/:id" element={<EditVehicle />} />
        
        {/* Customer Routes */}
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/customers/add" element={<AddCustomer />} />
        <Route path="/customers/edit/:id" element={<EditCustomer />} />
        
        {/* Agreement Routes */}
        <Route path="/agreements" element={<Agreements />} />
        <Route path="/agreements/:id" element={<AgreementDetailPage />} />
        <Route path="/agreements/add" element={<AddAgreement />} />
        <Route path="/agreements/edit/:id" element={<EditAgreement />} />
        
        {/* Maintenance Routes */}
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/maintenance/add" element={<AddMaintenance />} />
        <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
        <Route path="/maintenance/edit/:id" element={<EditMaintenance />} />
        
        {/* Other Routes */}
        <Route path="/financials" element={<Financials />} />
        <Route path="/traffic-fines" element={<TrafficFines />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/scheduled" element={<ScheduledReports />} />
        <Route path="/settings" element={<SystemSettings />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/user-settings" element={<UserSettings />} />
      </Route>
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
