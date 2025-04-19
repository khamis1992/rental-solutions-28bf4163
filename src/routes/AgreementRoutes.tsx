
import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Agreements from '@/pages/Agreements';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import AddAgreement from '@/pages/AddAgreement';
import EditAgreement from '@/pages/EditAgreement';

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
  />
];
