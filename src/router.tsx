
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import AuthRoutes from './routes/AuthRoutes';
import DashboardRoutes from './routes/DashboardRoutes';
import CustomerRoutes from './routes/CustomerRoutes';
import AgreementRoutes from './routes/AgreementRoutes';
import VehicleRoutes from './routes/VehicleRoutes';
import MaintenanceRoutes from './routes/MaintenanceRoutes';
import LegalRoutes from './routes/LegalRoutes';
import FinancialRoutes from './routes/FinancialRoutes';
import TrafficFineRoutes from './routes/TrafficFineRoutes';
import ReportRoutes from './routes/ReportRoutes';
import SettingsRoutes from './routes/SettingsRoutes';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />
  },
  {
    path: '/auth/*',
    element: <AuthRoutes />
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardRoutes />
      },
      {
        path: 'customers/*',
        element: <CustomerRoutes />
      },
      {
        path: 'agreements/*',
        element: <AgreementRoutes />
      },
      {
        path: 'vehicles/*',
        element: <VehicleRoutes />
      },
      {
        path: 'maintenance/*',
        element: <MaintenanceRoutes />
      },
      {
        path: 'legal/*',
        element: <LegalRoutes />
      },
      {
        path: 'financials/*',
        element: <FinancialRoutes />
      },
      {
        path: 'fines/*',
        element: <TrafficFineRoutes />
      },
      {
        path: 'reports/*',
        element: <ReportRoutes />
      },
      {
        path: 'settings/*',
        element: <SettingsRoutes />
      },
      {
        path: 'user-management',
        element: <SettingsRoutes />
      },
      {
        path: 'unauthorized',
        element: <NotFound />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;
