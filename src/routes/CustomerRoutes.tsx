
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Customers from '@/pages/Customers';
import AddCustomer from '@/pages/AddCustomer';
import CustomerDetailPage from '@/pages/CustomerDetailPage';
import EditCustomer from '@/pages/EditCustomer';

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route index element={<Customers />} />
      <Route path="add" element={<AddCustomer />} />
      <Route path=":id" element={<CustomerDetailPage />} />
      <Route path="edit/:id" element={<EditCustomer />} />
    </Routes>
  );
};

export default CustomerRoutes;
