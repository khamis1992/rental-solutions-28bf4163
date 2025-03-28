
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Agreements from './pages/Agreements';
import Maintenance from './pages/Maintenance';
import Financials from './pages/Financials';
import Legal from './pages/Legal';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import VehicleDetails from './pages/VehicleDetailPage';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import { PerformanceProvider } from '@/contexts/PerformanceContext';
import PerformanceMonitor from './pages/PerformanceMonitor';

function App() {
  return (
    <div className="app">
      <PerformanceProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/vehicles/add" element={<AddVehicle />} />
            <Route path="/vehicles/:id" element={<VehicleDetails />} />
            <Route path="/vehicles/:id/edit" element={<EditVehicle />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/agreements" element={<Agreements />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/user-management" element={<UserManagement />} />
            
            {/* Add the new performance route */}
            <Route path="/performance" element={<PerformanceMonitor />} />
          </Routes>
        </Router>
      </PerformanceProvider>
    </div>
  );
}

export default App;
