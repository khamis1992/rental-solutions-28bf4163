
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PageContainer from './components/layout/PageContainer';
import Financials from './pages/Financials';
import Expenses from './pages/Expenses';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
