import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Providers } from './providers';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Agreements from './pages/Agreements';
import Maintenance from './pages/Maintenance';
import Fines from './pages/Fines';
import Financials from './pages/Financials';
import Legal from './pages/Legal';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import VehicleDetails from './pages/VehicleDetails';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import { PerformanceProvider } from '@/contexts/PerformanceContext';
import PerformanceMonitor from './pages/PerformanceMonitor';

function App() {
  return (
    <Providers>
      <PerformanceProvider>
        <div className="app">
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
              <Route path="/fines" element={<Fines />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/system" element={<Settings />} />
              <Route path="/user-management" element={<UserManagement />} />
              
              {/* Add the new performance route */}
              <Route path="/performance" element={<PerformanceMonitor />} />
            </Routes>
          </Router>
        </div>
      </PerformanceProvider>
    </Providers>
  );
}

export default App;
