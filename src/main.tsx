
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.tsx';
import Vehicles from './pages/Vehicles.tsx';
import Customers from './pages/Customers.tsx';
import Agreements from './pages/Agreements.tsx';
import Maintenance from './pages/Maintenance.tsx';
import Financials from './pages/Financials.tsx';
import Reports from './pages/Reports.tsx';
import TrafficFines from './pages/TrafficFines.tsx';
import Legal from './pages/Legal.tsx';
import UserManagement from './pages/UserManagement.tsx';
import UserSettings from './pages/UserSettings.tsx';
import NotFound from './pages/NotFound.tsx';
import Index from './pages/Index.tsx';
import Login from './pages/auth/Login.tsx';
import Register from './pages/auth/Register.tsx';
import ForgotPassword from './pages/auth/ForgotPassword.tsx';

// Initialize React Query
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <Router>
    <QueryClientProvider client={queryClient}>
      <App>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/agreements" element={<Agreements />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/traffic-fines" element={<TrafficFines />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/user-settings" element={<UserSettings />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </App>
    </QueryClientProvider>
  </Router>
);
