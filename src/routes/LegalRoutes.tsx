
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Legal from '@/pages/Legal';
import NewLegalCasePage from '@/pages/NewLegalCasePage';

const LegalRoutes = () => {
  return (
    <Routes>
      <Route index element={<Legal />} />
      <Route path="cases/new" element={<NewLegalCasePage />} />
    </Routes>
  );
};

export default LegalRoutes;
