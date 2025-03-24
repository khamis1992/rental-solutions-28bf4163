
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PageContainer from './components/layout/PageContainer';
import Financials from './pages/Financials';
import Expenses from './pages/Expenses';

// Create placeholder components for missing pages
const Bookings = () => <PageContainer title="Bookings">Bookings page content</PageContainer>;
const Settings = () => <PageContainer title="Settings">Settings page content</PageContainer>;
const Login = () => <div className="p-8">Login page content</div>;
const ForgotPassword = () => <div className="p-8">Forgot Password page content</div>;
const ResetPassword = () => <div className="p-8">Reset Password page content</div>;

const AppContent = () => {
  const { isLoggedIn } = useAuth();

  return (
    
      <Routes>
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/bookings" element={isLoggedIn ? <Bookings /> : <Navigate to="/login" />} />
        <Route path="/vehicles" element={isLoggedIn ? <Vehicles /> : <Navigate to="/login" />} />
        <Route path="/customers" element={isLoggedIn ? <Customers /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isLoggedIn ? <Settings /> : <Navigate to="/login" />} />
        <Route path='/financials' element={<Financials />} />
        <Route path='/expenses' element={<Expenses />} />
      </Routes>
    
  );
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/bookings',
    element: <Bookings />
  },
  {
    path: '/vehicles',
    element: <Vehicles />
  },
  {
    path: '/customers',
    element: <Customers />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/financials',
    element: <Financials />
  },
  {
    path: '/expenses',
    element: <Expenses />
  },
]);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
