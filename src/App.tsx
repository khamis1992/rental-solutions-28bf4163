
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import CustomersList from '@/pages/CustomersList';
import CustomerDetails from '@/pages/CustomerDetails';
import Vehicles from '@/pages/Vehicles';
import VehicleDetails from '@/pages/VehicleDetails';
import SystemSettings from '@/pages/SystemSettings';
import Maintenance from '@/pages/Maintenance';
import Agreements from '@/pages/Agreements';
import AgreementDetailPage from '@/pages/AgreementDetailPage';
import EditAgreement from '@/pages/EditAgreement';
import NewAgreement from '@/pages/NewAgreement';
import TrafficFines from '@/pages/TrafficFines';
import Reports from '@/pages/Reports';
import Legal from '@/pages/Legal';
import CustomerImport from '@/pages/CustomerImport';
import NotFound from '@/pages/NotFound';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TranslationProvider } from '@/contexts/TranslationContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<CustomersList />} />
                <Route path="customers/:id" element={<CustomerDetails />} />
                <Route path="customers/import" element={<CustomerImport />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="vehicles/:id" element={<VehicleDetails />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="agreements" element={<Agreements />} />
                <Route path="agreements/:id" element={<AgreementDetailPage />} />
                <Route path="agreements/:id/edit" element={<EditAgreement />} />
                <Route path="agreements/new" element={<NewAgreement />} />
                <Route path="traffic-fines" element={<TrafficFines />} />
                <Route path="reports" element={<Reports />} />
                <Route path="legal" element={<Legal />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </TooltipProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
