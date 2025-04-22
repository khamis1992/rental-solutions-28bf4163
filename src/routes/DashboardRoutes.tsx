import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingScreen from '@/components/ui/loading-screen';

// Lazy load dashboard components
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const DashboardRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
    </Routes>
  );
};

export default DashboardRoutes;