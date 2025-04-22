import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load customer components
const Customers = lazy(() => import('@/pages/Customers'));
const AddCustomer = lazy(() => import('@/pages/AddCustomer'));
const EditCustomer = lazy(() => import('@/pages/EditCustomer'));
const CustomerDetail = lazy(() => import('@/pages/CustomerDetailPage'));

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route index element={<Customers />} />
      <Route path="add" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <AddCustomer />
        </ProtectedRoute>
      } />
      <Route path="edit/:id" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <EditCustomer />
        </ProtectedRoute>
      } />
      <Route path=":id" element={<CustomerDetail />} />
    </Routes>
  );
};

export default CustomerRoutes;