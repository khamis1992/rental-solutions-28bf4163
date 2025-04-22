import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy load agreement components
const Agreements = lazy(() => import('@/pages/Agreements'));
const AddAgreement = lazy(() => import('@/pages/AddAgreement'));
const EditAgreement = lazy(() => import('@/pages/EditAgreement'));
const AgreementDetail = lazy(() => import('@/pages/AgreementDetailPage'));

const AgreementRoutes = () => {
  return (
    <Routes>
      <Route index element={<Agreements />} />
      <Route path="add" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <AddAgreement />
        </ProtectedRoute>
      } />
      <Route path="edit/:id" element={
        <ProtectedRoute roles={['admin', 'staff']}>
          <EditAgreement />
        </ProtectedRoute>
      } />
      <Route path=":id" element={<AgreementDetail />} />
    </Routes>
  );
};

export default AgreementRoutes;
