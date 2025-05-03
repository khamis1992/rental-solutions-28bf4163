
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Agreements from '@/pages/Agreements';
import AddAgreement from '@/pages/AddAgreement';
import EditAgreement from '@/pages/EditAgreement';
import AgreementDetailPage from '@/pages/AgreementDetailPage';

const AgreementRoutes = () => {
  return (
    <Routes>
      <Route index element={<Agreements />} />
      <Route path="add" element={<AddAgreement />} />
      <Route path="edit/:id" element={<EditAgreement />} />
      <Route path=":id" element={<AgreementDetailPage />} />
    </Routes>
  );
};

export default AgreementRoutes;
