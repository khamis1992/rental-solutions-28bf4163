import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Agreements from '@/pages/Agreements';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import AddAgreement from '@/pages/AddAgreement';
import EditAgreement from '@/pages/EditAgreement';
import Payments from '@/pages/Payments';
import TrafficFines from '@/pages/TrafficFines';

export const AgreementRoutes = [
  <Route 
    key="agreements" 
    path="agreements" 
    element={
      <ProtectedRoute>
        <Agreements />
      </ProtectedRoute>
    } 
  />,
  <Route 
    key="add-agreement" 
    path="agreements/add" 
    element={
      <ProtectedRoute>
        <AddAgreement />
      </ProtectedRoute>
    } 
  />,
  <Route 
    key="edit-agreement" 
    path="agreements/edit/:id" 
    element={
      <ProtectedRoute>
        <EditAgreement />
      </ProtectedRoute>
    } 
  />,
  <Route 
    key="agreement-detail" 
    path="agreements/:id" 
    element={
      <ProtectedRoute>
        <AgreementDetailPage />
      </ProtectedRoute>
    } 
  />,
  <Route 
    key="agreement-payments" 
    path="agreements/:id/payments" 
    element={
      <ProtectedRoute>
        <Payments />
      </ProtectedRoute>
    } 
  />,
  <Route 
    key="agreement-fines" 
    path="agreements/:id/fines" 
    element={
      <ProtectedRoute>
        <TrafficFines />
      </ProtectedRoute>
    } 
  />
];
