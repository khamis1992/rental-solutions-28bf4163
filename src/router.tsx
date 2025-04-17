
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Agreements from './pages/Agreements';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import VehicleDetailPage from './pages/VehicleDetailPage';
import EditVehicle from './pages/EditVehicle';
import AddVehicle from './pages/AddVehicle';

// Define placeholder components for missing pages
const Settings = () => <div>Settings Page</div>;
const AgreementDetail = () => <div>Agreement Detail Page</div>;
const EditAgreement = () => <div>Edit Agreement Page</div>;
const CreateAgreement = () => <div>Create Agreement Page</div>;
const CreateVehicle = () => <div>Create Vehicle Page</div>;
const EditCustomer = () => <div>Edit Customer Page</div>;
const CreateCustomer = () => <div>Create Customer Page</div>;
const AgreementImportPage = () => <div>Agreement Import Page</div>;
const VehicleStatusUpdatePage = () => <div>Vehicle Status Update Page</div>;
const MobileDashboard = () => <div>Mobile Dashboard</div>;
const VehicleInspection = () => <div>Vehicle Inspection</div>;

// This is a simplified version. Further placeholders can be added as needed.

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/mobile',
        element: <MobileDashboard />,
      },
      {
        path: '/agreements',
        element: <Agreements />,
      },
      {
        path: '/agreements/:id',
        element: <AgreementDetail />,
      },
      {
        path: '/agreements/edit/:id',
        element: <EditAgreement />,
      },
      {
        path: '/agreements/add',
        element: <CreateAgreement />,
      },
      {
        path: '/agreements/import',
        element: <AgreementImportPage />,
      },
      {
        path: '/vehicles',
        element: <Vehicles />,
      },
      {
        path: '/vehicles/:id',
        element: <VehicleDetailPage />,
      },
      {
        path: '/vehicles/edit/:id',
        element: <EditVehicle />,
      },
      {
        path: '/vehicles/add',
        element: <AddVehicle />,
      },
      {
        path: '/status-update',
        element: <VehicleStatusUpdatePage />,
      },
      {
        path: '/customers',
        element: <Customers />,
      },
      {
        path: '/customers/edit/:id',
        element: <EditCustomer />,
      },
      {
        path: '/customers/add',
        element: <CreateCustomer />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;
