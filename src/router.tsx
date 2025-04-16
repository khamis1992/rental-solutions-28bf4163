
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Agreements from './pages/Agreements';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import AgreementDetail from './pages/AgreementDetail';
import EditAgreement from './pages/EditAgreement';
import CreateAgreement from './pages/CreateAgreement';
import VehicleDetailPage from './pages/VehicleDetailPage';
import EditVehicle from './pages/EditVehicle';
import CreateVehicle from './pages/CreateVehicle';
import CustomerDetailPage from './pages/CustomerDetailPage';
import EditCustomer from './pages/EditCustomer';
import CreateCustomer from './pages/CreateCustomer';
import AgreementImportPage from './pages/AgreementImportPage';
import VehicleStatusUpdatePage from "./pages/VehicleStatusUpdatePage";
import { useIsMobile } from "./hooks/use-mobile";
import { MobileDashboard } from "./components/mobile/MobileDashboard";
import { VehicleInspection } from "./components/mobile/VehicleInspection";
import NewLegalCasePage from "./pages/NewLegalCasePage";
import Legal from "./pages/Legal";

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: useIsMobile() ? <MobileDashboard /> : <Dashboard />,
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
        element: useIsMobile() ? <VehicleInspection /> : <Vehicles />,
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
        element: <CreateVehicle />,
      },
      {
        path: "status-update",
        element: <VehicleStatusUpdatePage />,
      },
      {
        path: '/customers',
        element: <Customers />,
      },
      {
        path: '/customers/:id',
        element: <CustomerDetailPage />,
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
      {
        path: '/legal',
        element: <Legal />,
      },
      {
        path: '/legal/cases/new',
        element: <NewLegalCasePage />,
      },
    ],
  },
]);

export default router;
