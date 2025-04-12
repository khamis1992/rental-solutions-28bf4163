
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Agreements from './pages/Agreements';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import SystemSettings from './pages/SystemSettings';
import AgreementDetailPage from './pages/AgreementDetailPage';
import EditAgreement from './pages/EditAgreement';
import AddAgreement from './pages/AddAgreement'; // Changed from CreateAgreement to AddAgreement
import VehicleDetailPage from './pages/VehicleDetailPage';
import EditVehicleNew from './pages/EditVehicleNew';
import CreateVehicle from './pages/CreateVehicle';
import CustomerDetailPage from './pages/CustomerDetailPage';
import EditCustomer from './pages/EditCustomer';
import CreateCustomer from './pages/CreateCustomer';
import AgreementImportPage from './pages/AgreementImportPage';
import VehicleStatusUpdatePage from "./pages/VehicleStatusUpdatePage";
import { MobileDashboard } from "./components/mobile/MobileDashboard";
import { VehicleInspection } from "./components/mobile/VehicleInspection";

// Create a route configuration that doesn't use hooks at the top level
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Dashboard />
      },
      {
        path: '/mobile',
        element: <MobileDashboard />
      },
      {
        path: '/agreements',
        element: <Agreements />
      },
      {
        path: '/agreements/:id',
        element: <AgreementDetailPage />
      },
      {
        path: '/agreements/edit/:id',
        element: <EditAgreement />
      },
      {
        path: '/agreements/add',
        element: <AddAgreement /> // Changed from CreateAgreement to AddAgreement
      },
      {
        path: '/agreements/import',
        element: <AgreementImportPage />
      },
      {
        path: '/vehicles',
        element: <Vehicles />
      },
      {
        // Route for mobile vehicle inspection
        path: '/vehicles/inspection',
        element: <VehicleInspection />
      },
      {
        path: '/vehicles/:id',
        element: <VehicleDetailPage />
      },
      {
        path: '/vehicles/edit/:id',
        element: <EditVehicleNew />
      },
      {
        path: '/vehicles/add',
        element: <CreateVehicle />
      },
      {
        path: "/status-update",
        element: <VehicleStatusUpdatePage />
      },
      {
        path: '/customers',
        element: <Customers />
      },
      {
        path: '/customers/:id',
        element: <CustomerDetailPage />
      },
      {
        path: '/customers/edit/:id',
        element: <EditCustomer />
      },
      {
        path: '/customers/add',
        element: <CreateCustomer />
      },
      {
        path: '/settings',
        element: <SystemSettings />
      }
    ]
  }
]);

export default router;
